import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, mentorshipRequests } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth || auth.role !== 'alumni') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Jobs Posted by this Alumni
        const [{ count: postedJobsCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(jobs)
            .where(eq(jobs.posterId, auth.id));

        // 2. Pending Mentorship Requests (Incoming)
        const [{ count: pendingRequestsCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .where(and(
                eq(mentorshipRequests.alumniId, auth.id),
                eq(mentorshipRequests.status, 'pending')
            ));

        // 3. Accepted Mentees (Active)
        const [{ count: acceptedMenteesCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .where(and(
                eq(mentorshipRequests.alumniId, auth.id),
                eq(mentorshipRequests.status, 'accepted')
            ));

        return NextResponse.json({
            stats: {
                myJobs: Number(postedJobsCount),
                pendingRequests: Number(pendingRequestsCount),
                acceptedMentees: Number(acceptedMenteesCount)
            }
        });

    } catch (error) {
        console.error('Alumni Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
