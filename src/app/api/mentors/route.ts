import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, alumniProfiles, mentorshipBlocks } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, ilike, or, sql, notInArray, isNull } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// GET /api/mentors — approved alumni, excluding globally-blocked mentors
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';
        const department = searchParams.get('department') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const offset = (page - 1) * limit;

        // Get IDs of globally-blocked mentors
        const blockedMentors = await db.select({ id: mentorshipBlocks.blockedMentorId })
            .from(mentorshipBlocks)
            .where(and(
                eq(mentorshipBlocks.scope, 'mentor_global'),
                eq(mentorshipBlocks.isActive, true)
            ));

        const blockedIds = blockedMentors
            .map(b => b.id)
            .filter((id): id is string => id !== null);

        // Build conditions
        const conditions: any[] = [
            eq(users.role, 'alumni'),
            eq(users.status, 'approved'),
            isNull(users.deletedAt),
        ];

        if (blockedIds.length > 0) {
            conditions.push(notInArray(users.id, blockedIds));
        }

        if (q) {
            conditions.push(or(
                ilike(users.fullName, `%${q}%`),
                ilike(users.name, `%${q}%`),
                ilike(alumniProfiles.company, `%${q}%`),
                ilike(alumniProfiles.department, `%${q}%`)
            ));
        }

        if (department) {
            conditions.push(eq(alumniProfiles.department, department));
        }

        // Count total
        const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .leftJoin(alumniProfiles, eq(users.id, alumniProfiles.userId))
            .where(and(...conditions));

        // Fetch items
        const items = await db.select({
            id: users.id,
            name: users.name,
            fullName: users.fullName,
            profileImage: users.profileImage,
            department: alumniProfiles.department,
            graduationYear: alumniProfiles.graduationYear,
            company: alumniProfiles.company,
            designation: alumniProfiles.designation,
            bio: alumniProfiles.bio,
            linkedin: alumniProfiles.linkedin,
        })
            .from(users)
            .leftJoin(alumniProfiles, eq(users.id, alumniProfiles.userId))
            .where(and(...conditions))
            .orderBy(users.fullName)
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            items,
            total: Number(totalCount),
            page,
            limit,
        });

    } catch (error) {
        console.error('Mentors List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
