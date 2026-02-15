import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversations, conversationParticipants, users, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { pusherServer } from '@/lib/pusher';
import { createNotification, NotificationType } from '@/lib/notifications';

const messageSchema = z.object({
    content: z.string().min(1).max(2000),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// POST: Send Message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Independent user status check — chat must not rely on earlier phases
        const [caller] = await db.select({ status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, auth.id)).limit(1);
        if (!caller || caller.status !== 'approved' || caller.deletedAt) {
            return NextResponse.json({ error: 'Account not active' }, { status: 403 });
        }

        const { id: conversationId } = await params;
        const body = await req.json();
        const { content } = messageSchema.parse(body);

        // 1. Verify membership AND blocked status
        const [participant] = await db.select({
            userId: conversationParticipants.userId,
            conversationIsBlocked: conversations.isBlocked,
            blockedReason: conversations.blockedReason,
            blockedSource: conversations.blockedSource
        })
            .from(conversationParticipants)
            .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, auth.id)
            ))
            .limit(1);

        if (!participant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (participant.conversationIsBlocked) {
            return NextResponse.json({
                error: 'CONVERSATION_BLOCKED',
                blockedReason: participant.blockedReason,
                blockedSource: participant.blockedSource
            }, { status: 403 });
        }

        // 2. Transaction: Insert Message + Update Conversation + Update Sender Read
        const newMessage = await db.transaction(async (tx) => {
            const [message] = await tx.insert(messages).values({
                conversationId,
                senderId: auth.id,
                content: content.trim(),
            }).returning();

            await tx.update(conversations)
                .set({ lastMessageAt: new Date() })
                .where(eq(conversations.id, conversationId));

            await tx.update(conversationParticipants)
                .set({ lastReadAt: new Date() })
                .where(and(
                    eq(conversationParticipants.conversationId, conversationId),
                    eq(conversationParticipants.userId, auth.id)
                ));

            return message;
        });

        // 3. Trigger Real-time Event (After Commit, Graceful if Pusher not configured)
        if (pusherServer) {
            try {
                await pusherServer.trigger(
                    `private-conversation-${conversationId}`,
                    'conversation:new_message',
                    {
                        id: newMessage.id,
                        content: newMessage.content,
                        senderId: newMessage.senderId,
                        createdAt: newMessage.createdAt,
                    }
                );
            } catch (pusherErr) {
                console.warn('Pusher trigger failed (non-critical):', pusherErr);
            }
        }

        // 4. Notify Other Participants
        const others = await db.select({ userId: conversationParticipants.userId })
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                sql`${conversationParticipants.userId} != ${auth.id}`
            ));

        if (others.length > 0) {
            await Promise.all(others.map(p =>
                createNotification({
                    recipientId: p.userId,
                    type: 'new_message',
                    title: 'New Message',
                    message: content.substring(0, 50),
                    referenceId: conversationId,
                    metadata: {
                        conversationId,
                        senderId: auth.id,
                        contentPreview: content.substring(0, 50)
                    }
                })
            ));
        }

        return NextResponse.json({ data: newMessage }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: List Messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Independent user status check
        const [caller] = await db.select({ status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, auth.id)).limit(1);
        if (!caller || caller.status !== 'approved' || caller.deletedAt) {
            return NextResponse.json({ error: 'Account not active' }, { status: 403 });
        }

        const { id: conversationId } = await params;
        const searchParams = new URL(req.url).searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        // 1. Verify membership
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

        // 2. Fetch Messages
        const results = await db.select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            createdAt: messages.createdAt,
            sender: {
                name: users.name,
                image: users.profileImage
            }
        })
            .from(messages)
            .innerJoin(users, eq(messages.senderId, users.id))
            .where(eq(messages.conversationId, conversationId))
            .orderBy(asc(messages.createdAt))
            .limit(limit > 100 ? 100 : limit)
            .offset(offset);

        // 3. Update Last Read (Side Effect)
        await db.update(conversationParticipants)
            .set({ lastReadAt: new Date() })
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, auth.id)
            ));

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('List Messages Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
