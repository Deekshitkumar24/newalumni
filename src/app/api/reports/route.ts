import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { aliasedTable } from 'drizzle-orm';

const reportSchema = z.object({
    reportedId: z.string().uuid(),
    reason: z.string().min(1, 'Reason is required'),
    description: z.string().min(1).max(2000).optional(),
    conversationId: z.string().uuid().optional(),
    snapshot: z.any().optional(),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// POST: Submit Report
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Active user check
        const [caller] = await db.select({ status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, auth.id)).limit(1);
        if (!caller || caller.status !== 'approved' || caller.deletedAt) {
            return NextResponse.json({ error: 'Account not active' }, { status: 403 });
        }

        const body = await req.json();
        const { reportedId, reason, description, snapshot } = reportSchema.parse(body);
        const fullReason = description ? `${reason}: ${description}` : reason;

        // Prevent self-report
        if (auth.id === reportedId) {
            return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
        }

        // Verify reported user exists
        const [reported] = await db.select({ id: users.id })
            .from(users).where(and(eq(users.id, reportedId), isNull(users.deletedAt))).limit(1);
        if (!reported) {
            return NextResponse.json({ error: 'Reported user not found' }, { status: 404 });
        }

        const [report] = await db.insert(reports).values({
            reporterId: auth.id,
            reportedId,
            reason: fullReason.trim(),
            snapshot: snapshot || null,
        }).returning();

        return NextResponse.json({ data: report }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Create Report Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: List Reports (Admin Only)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const reporter = aliasedTable(users, 'reporter');
        const reported = aliasedTable(users, 'reported');

        const list = await db.select({
            id: reports.id,
            reason: reports.reason,
            status: reports.status,
            timestamp: reports.createdAt,
            snapshot: reports.snapshot,
            reporterId: reports.reporterId,
            reportedId: reports.reportedId,
            reporterName: sql<string>`COALESCE(${reporter.fullName}, ${reporter.name}, 'Unknown')`.as('reporter_name'),
            reporterRole: reporter.role,
            reportedUserName: sql<string>`COALESCE(${reported.fullName}, ${reported.name}, 'Unknown')`.as('reported_user_name'),
            reportedUserRole: reported.role,
        })
            .from(reports)
            .leftJoin(reporter, eq(reports.reporterId, reporter.id))
            .leftJoin(reported, eq(reports.reportedId, reported.id))
            .orderBy(desc(reports.createdAt))
            .limit(100);

        return NextResponse.json(list);

    } catch (error) {
        console.error('Get Reports Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
