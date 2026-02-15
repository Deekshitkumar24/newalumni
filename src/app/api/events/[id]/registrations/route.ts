import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventRegistrations, users, studentProfiles } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, like, or, sql, desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url); // Use request URL to parse query params

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const dept = searchParams.get('dept') || 'All Departments';
        const year = searchParams.get('year') || 'All Years';
        const sort = searchParams.get('sort') || 'recent';

        const offset = (page - 1) * limit;

        // Build filtering conditions
        const conditions: (ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof or>)[] = [];

        conditions.push(eq(eventRegistrations.eventId, id));

        if (dept !== 'All Departments') {
            conditions.push(eq(studentProfiles.department, dept));
        }

        if (year !== 'All Years') {
            conditions.push(eq(studentProfiles.batch, parseInt(year)));
        }

        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            conditions.push(or(
                sql`lower(${users.name}) LIKE ${searchLower}`,
                sql`lower(${users.email}) LIKE ${searchLower}`,
                sql`lower(${studentProfiles.rollNumber}) LIKE ${searchLower}`
            ));
        }

        // Determine sort order
        let orderBy;
        switch (sort) {
            case 'alphabetical':
                orderBy = asc(users.name);
                break;
            case 'year':
                orderBy = asc(studentProfiles.batch);
                break;
            case 'recent':
            default:
                orderBy = desc(eventRegistrations.registeredAt);
        }

        // Count total matching
        // Use separate query for count to avoid type issues with array spread
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(eventRegistrations)
            .innerJoin(users, eq(eventRegistrations.userId, users.id))
            .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
            .where(and(...conditions));

        const totalWrapper = countResult as unknown as { count: string }; // Drizzle returns count as string/bigint usually
        const total = Number(totalWrapper.count);

        // Fetch data
        const data = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            status: users.status,
            rollNumber: studentProfiles.rollNumber,
            department: studentProfiles.department,
            graduationYear: studentProfiles.batch,
            registeredAt: eventRegistrations.registeredAt
        })
            .from(eventRegistrations)
            .innerJoin(users, eq(eventRegistrations.userId, users.id))
            .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("Event Registrations API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
