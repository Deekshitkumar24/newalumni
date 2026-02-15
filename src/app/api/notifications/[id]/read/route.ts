import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const notificationId = params.id;

        await db.update(notifications)
            .set({
                isRead: true,
                readAt: new Date()
            })
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.recipientId, auth.id)
            ));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notification Read Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
