import { NextResponse } from 'next/server';
import { db } from '@/db';
import { conversationParticipants, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// PATCH /api/conversations/[id]/read — Mark conversation as read
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id: conversationId } = await params;

        // Verify caller is a participant
        const [participant] = await db.select()
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, auth.id)
            ))
            .limit(1);

        if (!participant) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        // Update lastReadAt to now
        await db.update(conversationParticipants)
            .set({ lastReadAt: new Date() })
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, auth.id)
            ));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Mark Read Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
