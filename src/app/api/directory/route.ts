import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, studentProfiles, alumniProfiles } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull, like, ilike, sql, desc, or } from 'drizzle-orm';
import { z } from 'zod';

const directoryQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    role: z.enum(['student', 'alumni']).optional(),
    department: z.string().optional(),
    year: z.coerce.number().optional(), // Batch or Graduation Year
    company: z.string().optional(),
    query: z.string().optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const params = Object.fromEntries(searchParams.entries());

        const { page, limit, role, department, year, company, query } = directoryQuerySchema.parse(params);
        const offset = (page - 1) * limit;

        // Helper to build queries
        const buildQuery = (isCount: boolean) => {
            const baseConditions = [
                eq(users.status, 'approved'),
                isNull(users.deletedAt),
            ];

            if (role) {
                baseConditions.push(eq(users.role, role));
            }

            if (query) {
                baseConditions.push(sql`(${users.fullName} ILIKE ${`%${query}%`} OR ${users.email} ILIKE ${`%${query}%`})`);
            }

            let queryBuilder;

            if (role === 'student') {
                if (department) baseConditions.push(eq(studentProfiles.department, department));
                if (year) baseConditions.push(eq(studentProfiles.batch, year));

                const fields = isCount ? { count: sql<number>`count(*)` } : {
                    id: users.id,
                    fullName: users.fullName,
                    role: users.role,
                    profileImage: users.profileImage,
                    department: studentProfiles.department,
                    batch: studentProfiles.batch,
                };

                queryBuilder = db.select(fields as any)
                    .from(users)
                    .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
                    .where(and(...baseConditions));

            } else {
                if (department) baseConditions.push(eq(alumniProfiles.department, department));
                if (year) baseConditions.push(eq(alumniProfiles.graduationYear, year));
                if (company) baseConditions.push(ilike(alumniProfiles.company, `%${company}%`));

                if (!role) baseConditions.push(eq(users.role, 'alumni'));

                const fields = isCount ? { count: sql<number>`count(*)` } : {
                    id: users.id,
                    fullName: users.fullName,
                    role: users.role,
                    profileImage: users.profileImage,
                    department: alumniProfiles.department,
                    graduationYear: alumniProfiles.graduationYear,
                    company: alumniProfiles.company,
                    designation: alumniProfiles.designation,
                };

                queryBuilder = db.select(fields as any)
                    .from(users)
                    .innerJoin(alumniProfiles, eq(users.id, alumniProfiles.userId))
                    .where(and(...baseConditions));
            }

            return queryBuilder;
        };

        // 1. Get Data
        const dataQuery = buildQuery(false).limit(limit).offset(offset);
        // Include sort?
        // dataQuery = dataQuery.orderBy(desc(users.createdAt)); // Or name?

        const data = await dataQuery as any[];

        // 2. Get Total Count
        // We use the same query builder logic but select count
        const countRes = await buildQuery(true) as any[];
        const total = Number(countRes[0]?.count || 0);

        return NextResponse.json({
            data: data.map(u => ({
                ...u,
                name: u.fullName, // Map for UI if needed
                // Add friendly display fields
                currentRole: u.designation, // Map designation to currentRole
                currentCompany: u.company,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error('Directory API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
