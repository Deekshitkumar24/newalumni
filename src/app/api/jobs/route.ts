import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, alumniProfiles } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull, desc, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation Schema for Creating a Job
const createJobSchema = z.object({
    title: z.string().min(3).max(100),
    company: z.string().min(2).max(100),
    location: z.string().min(2).max(100),
    description: z.string().min(10),
    type: z.enum(['full_time', 'part_time', 'internship']),
});

// Validation for Query Params
const jobQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    company: z.string().optional(),
    type: z.enum(['full_time', 'part_time', 'internship']).optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// POST: Create a Job
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch full user to check status & role
        const user = await db.query.users.findFirst({
            where: eq(users.id, auth.id),
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        // 2. Security Checks
        if (user.status === 'suspended') {
            return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }
        if (user.status !== 'approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 });
        }
        if (user.deletedAt) {
            return NextResponse.json({ error: 'Account deleted' }, { status: 403 });
        }
        if (user.role !== 'alumni' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Only Alumni or Admin can post jobs' }, { status: 403 });
        }

        const body = await req.json();
        const data = createJobSchema.parse(body);

        // 3. Create Job
        // Admins auto-approve, Alumni are pending
        const initialStatus = user.role === 'admin' ? 'approved' : 'pending';

        const [newJob] = await db.insert(jobs).values({
            posterId: user.id,
            title: data.title,
            company: data.company,
            location: data.location,
            description: data.description,
            type: data.type,
            status: 'open',
            moderationStatus: initialStatus
        }).returning();

        return NextResponse.json({ success: true, data: newJob }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Job Create Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: List Jobs
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        // Allow public access? Requirements say "Alumni submits... Admin approves... Public visibility"
        // But usually job boards might be public or protected. 
        // Existing code checked auth. valid token seems required for now based on previous implementation.
        // Let's keep auth requirement for now to be safe, or allow public if specs say so.
        // "Student/Alumni views" implies logged in.

        // However, for pure public homepage, we might need to relax this. 
        // For now, let's assume strict auth as per previous code.

        const { searchParams } = new URL(req.url);
        const params = Object.fromEntries(searchParams.entries());
        const { page, limit, company, type } = jobQuerySchema.parse(params);
        const myJobs = searchParams.get('my_jobs') === 'true'; // New param for Alumni Dashboard
        const offset = (page - 1) * limit;

        const conditions = [
            eq(users.status, 'approved'),
            isNull(users.deletedAt)
        ];

        // Specific Logic for "My Jobs" vs "Public Board"
        if (myJobs) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            // Show ALL my jobs (pending, approved, rejected, open, closed)
            conditions.push(eq(jobs.posterId, auth.id));
        } else {
            // Public Board: ONLY Open AND Approved jobs
            conditions.push(eq(jobs.status, 'open'));
            conditions.push(eq(jobs.moderationStatus, 'approved'));
        }

        if (company) {
            conditions.push(ilike(jobs.company, `%${company}%`));
        }
        if (type) {
            conditions.push(eq(jobs.type, type));
        }

        // Join Jobs with Poster (Users)
        const results = await db.select({
            id: jobs.id,
            title: jobs.title,
            company: jobs.company,
            location: jobs.location,
            type: jobs.type,
            status: jobs.status, // open/closed
            moderationStatus: jobs.moderationStatus, // pending/approved/rejected
            createdAt: jobs.createdAt,
            postedAt: jobs.createdAt,
            poster: {
                id: users.id,
                fullName: users.fullName,
                role: users.role,
                profileImage: users.profileImage
            }
        })
            .from(jobs)
            .innerJoin(users, eq(jobs.posterId, users.id))
            .where(and(...conditions))
            .orderBy(desc(jobs.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        // Simplified count query
        // const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(jobs)... (omitted for brevity/perf unless requested)

        return NextResponse.json({
            data: results,
            meta: { page, limit } // Todo: Add total count if critical for pagination UI
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Job List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
