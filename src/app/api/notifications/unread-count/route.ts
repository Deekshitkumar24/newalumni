import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, count } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const result = await db.select({ count: count() })
            .from(notifications)
            .where(and(
                eq(notifications.recipientId, auth.id),
                eq(notifications.isRead, false)
            ));

        const unreadCount = result[0]?.count || 0;

        return NextResponse.json({ unreadCount });
    } catch (error) {
        console.error('Notifications Count Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
