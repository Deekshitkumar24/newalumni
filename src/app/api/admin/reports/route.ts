import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, sql } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List Reports (Admin Only)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = new URL(req.url).searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const statusFilter = searchParams.get('status'); // open | resolved | dismissed
        const offset = (page - 1) * limit;

        const conditions: any[] = [];
        if (statusFilter && ['open', 'resolved', 'dismissed'].includes(statusFilter)) {
            conditions.push(eq(reports.status, statusFilter as any));
        }

        const whereClause = conditions.length > 0 ? conditions[0] : undefined;

        const results = await db.select({
            id: reports.id,
            reporterId: reports.reporterId,
            reportedId: reports.reportedId,
            reason: reports.reason,
            snapshot: reports.snapshot,
            status: reports.status,
            createdAt: reports.createdAt,
        })
            .from(reports)
            .where(whereClause)
            .orderBy(desc(reports.createdAt))
            .limit(limit > 100 ? 100 : limit)
            .offset(offset);

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('Admin List Reports Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
