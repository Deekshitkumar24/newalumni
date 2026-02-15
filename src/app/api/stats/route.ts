import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, events, jobs, mentorshipRequests } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function GET() {
    try {
        const [alumniCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(eq(users.role, 'alumni'), eq(users.status, 'approved'), isNull(users.deletedAt)));

        const [studentCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(eq(users.role, 'student'), eq(users.status, 'approved'), isNull(users.deletedAt)));

        const [eventCount] = await db.select({ count: sql<number>`count(*)` })
            .from(events);

        const [jobCount] = await db.select({ count: sql<number>`count(*)` })
            .from(jobs)
            .where(and(eq(jobs.status, 'open'), eq(jobs.moderationStatus, 'approved')));

        const [pendingAlumniCount] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(eq(users.role, 'alumni'), eq(users.status, 'pending'), isNull(users.deletedAt)));

        const [mentorshipCount] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .where(eq(mentorshipRequests.status, 'pending'));

        return NextResponse.json({
            totalAlumni: Number(alumniCount.count),
            totalStudents: Number(studentCount.count),
            totalEvents: Number(eventCount.count),
            activeJobs: Number(jobCount.count),
            pendingAlumni: Number(pendingAlumniCount.count),
            mentorships: Number(mentorshipCount.count)
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
