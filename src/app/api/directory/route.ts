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
                baseConditions.push(or(
                    ilike(users.fullName, `%${query}%`),
                    ilike(users.email, `%${query}%`)
                ));
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
                    linkedIn: studentProfiles.linkedIn,
                    website: studentProfiles.website,
                    github: studentProfiles.github
                };

                queryBuilder = db.select(fields)
                    .from(users)
                    .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
                    .where(and(...baseConditions));

            } else {
                // Default to alumni search if no role specified or explicitly 'alumni'
                // Since this is "Alumni Directory", defaults to alumni usually.
                // But if role is explicitly 'alumni', apply specific filters.

                if (department) baseConditions.push(eq(alumniProfiles.department, department));
                if (year) baseConditions.push(eq(alumniProfiles.graduationYear, year));
                if (company) baseConditions.push(ilike(alumniProfiles.company, `%${company}%`));

                // Strict 'alumni' if role not provided? 
                // Let's assume yes for consistent "Directory" behavior usually focused on Alumni.
                // Or if we want mixed, we need a Union. For now, defaulting to 'alumni' (or both if careful).
                // But `alumniProfiles` join forces alumni.

                // If role is undefined, we force 'alumni' logic for now as it's the safest assumption for "Alumni Directory" calls
                // If user wants students, they should pass role='student'
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
                    linkedIn: alumniProfiles.linkedIn,
                    website: alumniProfiles.website,
                    // github: alumniProfiles.github // Check schema if exists
                };

                queryBuilder = db.select(fields)
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

        const data = await dataQuery;

        // 2. Get Total Count
        // We use the same query builder logic but select count
        const countRes = await buildQuery(true);
        const total = Number(countRes[0]?.count || 0);

        return NextResponse.json({
            data: data.map(u => ({
                ...u,
                name: u.fullName, // Map for UI if needed
                // Add friendly display fields
                currentRole: (u as any).designation, // Map designation to currentRole
                currentCompany: (u as any).company,
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
