import { NextResponse } from 'next/server';
import { db } from '@/db';
import { applications, jobs, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const updateStatusSchema = z.object({
    status: z.enum(['reviewed', 'shortlisted', 'rejected', 'accepted']),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Update Application Status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id: appId } = await params;
        const body = await req.json();
        const { status } = updateStatusSchema.parse(body);

        // 1. Fetch Application + Job
        // We need to verify if the requester is the Job Poster or Admin
        const application = await db.select({
            id: applications.id,
            jobId: applications.jobId,
            applicantId: applications.applicantId,
            posterId: jobs.posterId,
            jobTitle: jobs.title,
        })
            .from(applications)
            .innerJoin(jobs, eq(applications.jobId, jobs.id))
            .where(eq(applications.id, appId))
            .limit(1);

        if (application.length === 0) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const app = application[0];

        // 2. Check Auth (Poster or Admin)
        // Admin check usually involves fetching user role again, but auth payload has role?
        // Let's stick to strict DB check if we want to be safe, or payload if stored properly.
        // For now, let's fetch user to be sure.
        const requester = await db.query.users.findFirst({
            where: eq(users.id, auth.id),
        });

        if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isPoster = app.posterId === requester.id;
        const isAdmin = requester.role === 'admin';

        if (!isPoster && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Update Status
        await db.update(applications)
            .set({ status })
            .where(eq(applications.id, appId));

        // 4. Notify Applicant
        await createNotification({
            recipientId: app.applicantId,
            type: 'job_application_update',
            title: 'Application Update',
            message: `Your application for ${app.jobTitle} is now ${status}`,
            referenceId: app.id,
        });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Application Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
