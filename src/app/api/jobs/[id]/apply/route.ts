import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, applications, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// POST: Apply for a Job
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id: jobId } = await params;

        // 1. Check User Role & Status
        const user = await db.query.users.findFirst({
            where: eq(users.id, auth.id),
        });

        if (!user || user.status !== 'approved' || user.deletedAt) {
            return NextResponse.json({ error: 'Account not eligible to apply' }, { status: 403 });
        }
        if (user.role !== 'student') {
            return NextResponse.json({ error: 'Only students can apply' }, { status: 403 });
        }

        // 2. Check Job Validity
        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, jobId),
        });

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        if (job.status !== 'open') return NextResponse.json({ error: 'Job is closed' }, { status: 400 });

        // 3. Check Duplicate Application
        const existingApp = await db.query.applications.findFirst({
            where: and(
                eq(applications.jobId, jobId),
                eq(applications.applicantId, user.id)
            ),
        });

        if (existingApp) {
            return NextResponse.json({ error: 'Already applied' }, { status: 409 });
        }

        // 4. Create Application
        const [newApp] = await db.insert(applications).values({
            jobId: jobId,
            applicantId: user.id,
            status: 'pending',
        }).returning();

        // 5. Notify Job Poster
        await createNotification({
            recipientId: job.posterId,
            type: 'job_application_update', // Reusing this type generally
            title: 'New Job Application',
            message: `${user.name} applied for ${job.title}`,
            referenceId: newApp.id,
        });

        return NextResponse.json({ success: true, data: newApp }, { status: 201 });

    } catch (error) {
        console.error('Job Apply Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
