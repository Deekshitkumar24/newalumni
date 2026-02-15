import { NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, conversationParticipants, users, mentorshipRequests, messages, mentorshipBlocks } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, or, sql, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';

const createConversationSchema = z.object({
    type: z.enum(['direct']),
    participantId: z.string().uuid(),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// POST: Create Conversation
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { type, participantId } = createConversationSchema.parse(body);

        if (auth.id === participantId) {
            return NextResponse.json({ error: 'Cannot chat with self' }, { status: 400 });
        }

        // 1. Verify BOTH users are approved and not soft-deleted
        const [caller] = await db.select({ id: users.id, status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, auth.id)).limit(1);
        const [target] = await db.select({ id: users.id, status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, participantId)).limit(1);

        if (!caller || caller.status !== 'approved' || caller.deletedAt) {
            return NextResponse.json({ error: 'Your account is not active' }, { status: 403 });
        }
        if (!target || target.status !== 'approved' || target.deletedAt) {
            return NextResponse.json({ error: 'Target user is not active' }, { status: 403 });
        }

        // 2. Check for Mentorship Blocks (Strict Permission Gating)
        const activeBlock = await db.query.mentorshipBlocks.findFirst({
            where: and(
                eq(mentorshipBlocks.isActive, true),
                or(
                    // Student Global Block
                    and(eq(mentorshipBlocks.scope, 'student_global'), or(eq(mentorshipBlocks.blockedStudentId, auth.id), eq(mentorshipBlocks.blockedStudentId, participantId))),
                    // Mentor Global Block
                    and(eq(mentorshipBlocks.scope, 'mentor_global'), or(eq(mentorshipBlocks.blockedMentorId, auth.id), eq(mentorshipBlocks.blockedMentorId, participantId))),
                    // Pair Block (Direction 1)
                    and(eq(mentorshipBlocks.scope, 'pair_block'), eq(mentorshipBlocks.blockedStudentId, auth.id), eq(mentorshipBlocks.blockedMentorId, participantId)),
                    // Pair Block (Direction 2)
                    and(eq(mentorshipBlocks.scope, 'pair_block'), eq(mentorshipBlocks.blockedStudentId, participantId), eq(mentorshipBlocks.blockedMentorId, auth.id))
                )
            )
        });

        if (activeBlock) {
            return NextResponse.json({
                error: 'CHAT_BLOCKED',
                blockedReason: activeBlock.reason || 'Mentorship blocking rule active',
                blockedSource: 'mentorship_block'
            }, { status: 403 });
        }

        // 3. Verify Mentorship Status (must be accepted AND not stopped by admin)
        const mentorship = await db.query.mentorshipRequests.findFirst({
            where: or(
                and(eq(mentorshipRequests.studentId, auth.id), eq(mentorshipRequests.alumniId, participantId)),
                and(eq(mentorshipRequests.studentId, participantId), eq(mentorshipRequests.alumniId, auth.id))
            )
        });

        if (!mentorship || mentorship.status !== 'accepted') {
            return NextResponse.json({ error: 'Mentorship connection required' }, { status: 403 });
        }

        if (mentorship.stoppedByAdmin) {
            return NextResponse.json({
                error: 'CHAT_BLOCKED',
                blockedReason: mentorship.stopReason || 'Mentorship stopped by admin',
                blockedSource: 'mentorship_force_stop'
            }, { status: 403 });
        }

        // 3. Generate Unique Key (sorted user IDs)
        const userIds = [auth.id, participantId].sort();
        const uniqueKey = `${userIds[0]}:${userIds[1]}`;

        // 4. Check for Existing Conversation First
        const [existing] = await db.select()
            .from(conversations)
            .where(eq(conversations.uniqueKey, uniqueKey))
            .limit(1);

        if (existing) {
            if (existing.isBlocked) {
                return NextResponse.json({
                    error: 'CHAT_BLOCKED',
                    blockedReason: existing.blockedReason,
                    blockedSource: existing.blockedSource
                }, { status: 403 });
            }
            return NextResponse.json({ data: existing }, { status: 200 });
        }

        // 5. Create New Conversation + Participants (Transaction)
        try {
            const result = await db.transaction(async (tx) => {
                const [newConv] = await tx.insert(conversations).values({
                    type: 'direct',
                    uniqueKey: uniqueKey,
                }).returning();

                await tx.insert(conversationParticipants).values([
                    { conversationId: newConv.id, userId: auth.id },
                    { conversationId: newConv.id, userId: participantId }
                ]);

                return newConv;
            });

            return NextResponse.json({ data: result }, { status: 201 });

        } catch (insertError: any) {
            // Race condition: another request created it between our check and insert
            if (insertError.code === '23505') {
                const [raceWinner] = await db.select()
                    .from(conversations)
                    .where(eq(conversations.uniqueKey, uniqueKey))
                    .limit(1);
                return NextResponse.json({ data: raceWinner }, { status: 200 });
            }
            throw insertError;
        }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Create Conversation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: List My Conversations (with real unreadCount + lastMessage)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify caller is active
        const [caller] = await db.select({ status: users.status, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, auth.id)).limit(1);
        if (!caller || caller.status !== 'approved' || caller.deletedAt) {
            return NextResponse.json({ error: 'Account not active' }, { status: 403 });
        }

        // Step 1: Get Conversation IDs + my lastReadAt
        const myConvs = await db.select({
            id: conversationParticipants.conversationId,
            lastReadAt: conversationParticipants.lastReadAt
        })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.userId, auth.id));

        const convIds = myConvs.map(c => c.id);
        if (convIds.length === 0) return NextResponse.json({ data: [] });

        // Build a map of lastReadAt per conversation
        const lastReadMap = new Map<string, Date | null>();
        myConvs.forEach(c => lastReadMap.set(c.id, c.lastReadAt));

        // Step 2: Fetch Conversations + Other Participants (only active users)
        const results = await db.select({
            id: conversations.id,
            type: conversations.type,
            lastMessageAt: conversations.lastMessageAt,
            // Blocking fields
            isBlocked: conversations.isBlocked,
            blockedReason: conversations.blockedReason,
            blockedSource: conversations.blockedSource,
            blockedByAdminId: conversations.blockedByAdminId,
            blockedAt: conversations.blockedAt,
            participantId: users.id,
            participantName: users.name,
            participantFullName: users.fullName,
            participantImage: users.profileImage,
            participantRole: users.role,
        })
            .from(conversations)
            .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
            .innerJoin(users, eq(conversationParticipants.userId, users.id))
            .where(and(
                sql`${conversations.id} IN (${sql.join(convIds.map(id => sql`${id}`), sql`, `)})`,
                sql`${users.id} != ${auth.id}`,
                isNull(users.deletedAt)
            ))
            .orderBy(desc(conversations.lastMessageAt));

        // Step 3: For each conversation, compute unreadCount + lastMessage
        const formattedConversations = await Promise.all(results.map(async (r) => {
            const lastReadAt = lastReadMap.get(r.id);

            // Compute unread count: messages after lastReadAt from other users
            let unreadCount = 0;
            if (lastReadAt) {
                const [result] = await db.select({ count: sql<number>`count(*)` })
                    .from(messages)
                    .where(and(
                        eq(messages.conversationId, r.id),
                        sql`${messages.senderId} != ${auth.id}`,
                        sql`${messages.createdAt} > ${lastReadAt}`
                    ));
                unreadCount = Number(result?.count || 0);
            } else {
                // No lastReadAt = never read = count all messages from others
                const [result] = await db.select({ count: sql<number>`count(*)` })
                    .from(messages)
                    .where(and(
                        eq(messages.conversationId, r.id),
                        sql`${messages.senderId} != ${auth.id}`
                    ));
                unreadCount = Number(result?.count || 0);
            }

            // Get last message preview
            const [lastMsg] = await db.select({
                content: messages.content,
                senderId: messages.senderId,
                createdAt: messages.createdAt,
            })
                .from(messages)
                .where(eq(messages.conversationId, r.id))
                .orderBy(desc(messages.createdAt))
                .limit(1);

            const lastMessage = lastMsg
                ? (lastMsg.senderId === auth.id ? `You: ${lastMsg.content}` : lastMsg.content)
                : '';

            return {
                id: r.id,
                type: r.type,
                lastMessageAt: lastMsg?.createdAt || r.lastMessageAt,
                lastMessage: lastMessage.length > 60 ? lastMessage.slice(0, 60) + '…' : lastMessage,
                unreadCount,
                // Pass through blocking info
                isBlocked: r.isBlocked,
                blockedReason: r.blockedReason,
                blockedSource: r.blockedSource,
                participants: [
                    {
                        id: r.participantId,
                        name: r.participantName,
                        fullName: r.participantFullName,
                        profileImage: r.participantImage,
                        role: r.participantRole,
                        department: 'N/A'
                    }
                ]
            };
        }));

        return NextResponse.json({ data: formattedConversations });

    } catch (error) {
        console.error('List Conversations Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
