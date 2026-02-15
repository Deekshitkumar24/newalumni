import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, mentorshipRequests, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, gt, sql, isNull } from 'drizzle-orm';
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
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Upcoming Events Count (Global events for now, or filtered if needed)
        // Assuming events are visible to all students
        const [{ count: upcomingEventsCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(events)
            .where(gt(events.date, new Date()));

        // 2. Pending Mentorship Requests
        const [{ count: pendingRequestsCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .where(and(
                eq(mentorshipRequests.studentId, auth.id),
                eq(mentorshipRequests.status, 'pending')
            ));

        // 3. Accepted Mentors
        const [{ count: acceptedMentorsCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .where(and(
                eq(mentorshipRequests.studentId, auth.id),
                eq(mentorshipRequests.status, 'accepted')
            ));

        // 4. Get User Profile Data (if needed specifically for header, though useAuth handles it)
        // We'll stick to stats for this specific endpoint to keep it light.

        return NextResponse.json({
            stats: {
                upcomingEvents: Number(upcomingEventsCount),
                pendingRequests: Number(pendingRequestsCount),
                acceptedMentors: Number(acceptedMentorsCount)
            }
        });

    } catch (error) {
        console.error('Student Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
