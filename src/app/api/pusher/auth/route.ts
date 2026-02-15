import { NextResponse } from 'next/server';
import { db } from '@/db';
import { conversationParticipants } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// POST: Authorize Channel
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!pusherServer) {
            return NextResponse.json({ error: 'Real-time not configured' }, { status: 503 });
        }

        const body = await req.text();
        const params = new URLSearchParams(body);
        const socketId = params.get('socket_id');
        const channelName = params.get('channel_name');

        if (!socketId || !channelName) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Validate Channel Format: private-conversation-[id]
        const match = channelName.match(/^private-conversation-(.+)$/);
        if (!match) {
            return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
        }

        const conversationId = match[1];

        // Validate Membership
        const [participant] = await db.select()
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, auth.id)
            ))
            .limit(1);

        if (!participant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Authorize
        const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
            user_id: auth.id,
            user_info: { id: auth.id }
        });

        return NextResponse.json(authResponse);

    } catch (error) {
        console.error('Pusher Auth Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
