import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, auditLogs } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
    status: z.enum(['resolved', 'dismissed']),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Resolve / Dismiss Report
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = updateSchema.parse(body);

        // Fetch report
        const [report] = await db.select()
            .from(reports).where(eq(reports.id, id)).limit(1);

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }
        if (report.status !== 'open') {
            return NextResponse.json({ error: 'Report already resolved' }, { status: 400 });
        }

        // Update + audit
        await db.transaction(async (tx) => {
            await tx.update(reports)
                .set({ status: status as any })
                .where(eq(reports.id, id));

            await tx.insert(auditLogs).values({
                actorId: auth.id,
                action: `report_${status}`,
                targetId: id,
                metadata: { reportedUserId: report.reportedId },
            });
        });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Report Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
