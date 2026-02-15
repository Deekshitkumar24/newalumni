import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const updateJobModerationSchema = z.object({
    moderationStatus: z.enum(['approved', 'rejected']),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Moderate Job (Admin Only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const data = updateJobModerationSchema.parse(body);

        const [updatedJob] = await db.update(jobs)
            .set({ moderationStatus: data.moderationStatus })
            .where(eq(jobs.id, id))
            .returning();

        if (updatedJob) {
            await createNotification({
                recipientId: updatedJob.posterId,
                type: data.moderationStatus === 'approved' ? 'job_approved' : 'job_rejected',
                title: `Job Posting ${data.moderationStatus === 'approved' ? 'Approved' : 'Rejected'}`,
                message: `Your job posting "${updatedJob.title}" has been ${data.moderationStatus}.`,
                referenceId: updatedJob.id,
                metadata: {
                    jobId: updatedJob.id,
                    status: data.moderationStatus
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Job Moderation PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
