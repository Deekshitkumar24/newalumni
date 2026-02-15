import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: Fetch Pending Jobs (Admin Only)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;
        const statusFilter = searchParams.get('status'); // 'pending', 'approved', 'rejected', or 'all'

        let statusCondition = undefined;
        if (statusFilter && statusFilter !== 'all') {
            statusCondition = eq(jobs.moderationStatus, statusFilter as any);
        } else if (!statusFilter) {
            statusCondition = eq(jobs.moderationStatus, 'pending');
        }

        const conditions = [];
        if (statusCondition) conditions.push(statusCondition);

        const results = await db.select({
            id: jobs.id,
            title: jobs.title,
            company: jobs.company,
            location: jobs.location,
            type: jobs.type,
            status: jobs.status,
            moderationStatus: jobs.moderationStatus,
            createdAt: jobs.createdAt,
            poster: {
                id: users.id,
                fullName: users.fullName,
                role: users.role,
                email: users.email
            }
        })
            .from(jobs)
            .innerJoin(users, eq(jobs.posterId, users.id))
            .where(and(...conditions))
            .orderBy(desc(jobs.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data: results,
            meta: { page, limit }
        });

    } catch (error) {
        console.error('Admin Jobs GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
