import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, and } from 'drizzle-orm';

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

        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.recipientId, auth.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 50, // Pagination limit
        });

        // Calculate unread count (could be optimized with a separate query if list is long)
        const unreadCount = userNotifications.filter(n => !n.isRead).length;

        return NextResponse.json({
            data: userNotifications,
            meta: { unreadCount }
        });
    } catch (error) {
        console.error('Notifications List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
