import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipRequests, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// GET /api/admin/mentorship/requests — Admin list all requests
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || '';
        const q = searchParams.get('q') || '';
        const stopped = searchParams.get('stopped');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const offset = (page - 1) * limit;

        const students = alias(users, 'students');
        const mentors = alias(users, 'mentors');

        const conditions: any[] = [];

        if (status) {
            conditions.push(eq(mentorshipRequests.status, status as any));
        }

        if (stopped === 'true') {
            conditions.push(eq(mentorshipRequests.stoppedByAdmin, true));
        } else if (stopped === 'false') {
            conditions.push(eq(mentorshipRequests.stoppedByAdmin, false));
        }

        if (q) {
            conditions.push(or(
                ilike(students.name, `%${q}%`),
                ilike(students.email, `%${q}%`),
                ilike(students.fullName, `%${q}%`),
                ilike(mentors.name, `%${q}%`),
                ilike(mentors.email, `%${q}%`),
                ilike(mentors.fullName, `%${q}%`)
            ));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Count
        const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(mentorshipRequests)
            .innerJoin(students, eq(mentorshipRequests.studentId, students.id))
            .innerJoin(mentors, eq(mentorshipRequests.alumniId, mentors.id))
            .where(whereClause);

        // Data
        const results = await db.select({
            id: mentorshipRequests.id,
            status: mentorshipRequests.status,
            requestType: mentorshipRequests.requestType,
            description: mentorshipRequests.description,
            message: mentorshipRequests.message,
            stoppedByAdmin: mentorshipRequests.stoppedByAdmin,
            stopReason: mentorshipRequests.stopReason,
            stoppedAt: mentorshipRequests.stoppedAt,
            createdAt: mentorshipRequests.createdAt,
            updatedAt: mentorshipRequests.updatedAt,
            student: {
                id: students.id,
                name: students.name,
                fullName: students.fullName,
                email: students.email,
                profileImage: students.profileImage,
            },
            mentor: {
                id: mentors.id,
                name: mentors.name,
                fullName: mentors.fullName,
                email: mentors.email,
                profileImage: mentors.profileImage,
            }
        })
            .from(mentorshipRequests)
            .innerJoin(students, eq(mentorshipRequests.studentId, students.id))
            .innerJoin(mentors, eq(mentorshipRequests.alumniId, mentors.id))
            .where(whereClause)
            .orderBy(desc(mentorshipRequests.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data: results,
            total: Number(totalCount),
            page,
            limit,
        });

    } catch (error) {
        console.error('Admin Mentorship List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
