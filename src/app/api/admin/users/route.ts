import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, sql, isNull, desc } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List Users (Admin Only)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = new URL(req.url).searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const roleFilter = searchParams.get('role'); // student | alumni | admin
        const statusFilter = searchParams.get('status'); // pending | approved | rejected | suspended
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions: any[] = [isNull(users.deletedAt)];
        if (roleFilter && ['student', 'alumni', 'admin'].includes(roleFilter)) {
            conditions.push(eq(users.role, roleFilter as any));
        }
        if (statusFilter && ['pending', 'approved', 'rejected', 'suspended'].includes(statusFilter)) {
            conditions.push(eq(users.status, statusFilter as any));
        }

        // Count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(...conditions));

        // Fetch (exclude passwordHash)
        const results = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            fullName: users.fullName,
            role: users.role,
            status: users.status,
            profileImage: users.profileImage,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
            .from(users)
            .where(and(...conditions))
            .orderBy(desc(users.createdAt))
            .limit(limit > 100 ? 100 : limit)
            .offset(offset);

        return NextResponse.json({
            data: results,
            pagination: {
                page,
                limit,
                total: Number(count),
                totalPages: Math.ceil(Number(count) / limit),
            }
        });

    } catch (error) {
        console.error('Admin List Users Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
