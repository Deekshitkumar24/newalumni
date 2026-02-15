import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { aliasedTable } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// GET: Get single report by ID (Admin only)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        const reporter = aliasedTable(users, 'reporter');
        const reported = aliasedTable(users, 'reported');

        const [report] = await db.select({
            id: reports.id,
            reason: reports.reason,
            status: reports.status,
            snapshot: reports.snapshot,
            adminNotes: reports.adminNotes,
            timestamp: reports.createdAt,
            updatedAt: reports.updatedAt,
            reporterId: reports.reporterId,
            reportedId: reports.reportedId,
            reporterName: sql<string>`COALESCE(${reporter.fullName}, ${reporter.name}, 'Unknown')`.as('reporter_name'),
            reporterRole: reporter.role,
            reporterImage: reporter.profileImage,
            reportedUserName: sql<string>`COALESCE(${reported.fullName}, ${reported.name}, 'Unknown')`.as('reported_user_name'),
            reportedUserRole: reported.role,
            reportedUserImage: reported.profileImage,
        })
            .from(reports)
            .leftJoin(reporter, eq(reports.reporterId, reporter.id))
            .leftJoin(reported, eq(reports.reportedId, reported.id))
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({ data: report });

    } catch (error) {
        console.error('Get Report Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

const updateSchema = z.object({
    status: z.enum(['open', 'resolved', 'dismissed']).optional(),
    adminNotes: z.string().max(2000).optional(),
});

// PATCH: Update report status/notes (Admin only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, adminNotes } = updateSchema.parse(body);

        // Verify report exists
        const [existing] = await db.select({ id: reports.id })
            .from(reports).where(eq(reports.id, id)).limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const [updated] = await db.update(reports)
            .set(updateData)
            .where(eq(reports.id, id))
            .returning();

        return NextResponse.json({ data: updated });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Update Report Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
