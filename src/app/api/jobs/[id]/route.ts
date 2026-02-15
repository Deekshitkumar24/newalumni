import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Fetch Job with Poster
        // Enforce Poster Not Deleted
        const job = await db.select({
            id: jobs.id,
            title: jobs.title,
            company: jobs.company,
            location: jobs.location,
            description: jobs.description,
            type: jobs.type,
            status: jobs.status,
            createdAt: jobs.createdAt,
            poster: {
                id: users.id,
                fullName: users.fullName,
                role: users.role,
                profileImage: users.profileImage
            }
        })
            .from(jobs)
            .innerJoin(users, eq(jobs.posterId, users.id))
            .where(and(
                eq(jobs.id, id),
                isNull(users.deletedAt),
                eq(users.status, 'approved')
            ))
            .limit(1);

        if (job.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ data: job[0] });

    } catch (error) {
        console.error('Job Detail Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
// DELETE: Delete Job (Admin or Owner)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Check ownership or admin
        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, id),
        });

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

        if (auth.role !== 'admin' && job.posterId !== auth.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.delete(jobs).where(eq(jobs.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Job Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH: Update Job (Owner/Admin) - e.g. Close Job
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        // Check ownership or admin
        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, id),
        });

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

        if (auth.role !== 'admin' && job.posterId !== auth.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Only allow updating status for now via this route (or full update if needed)
        // For simplicity, let's allow updating status and basic fields if provided
        // But mainly status for 'closed'
        if (body.status && ['open', 'closed'].includes(body.status)) {
            await db.update(jobs)
                .set({ status: body.status })
                .where(eq(jobs.id, id));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Job Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
