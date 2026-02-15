import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipBlocks, users, conversations, conversationParticipants } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { alias } from 'drizzle-orm/pg-core';

const blockSchema = z.object({
    scope: z.enum(['student_global', 'mentor_global', 'pair_block']),
    blockedStudentId: z.string().uuid().optional(),
    blockedMentorId: z.string().uuid().optional(),
    reason: z.string().optional(),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// GET /api/admin/mentorship/blocks — List all blocks
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const blockedStudents = alias(users, 'blocked_students');
        const blockedMentors = alias(users, 'blocked_mentors');
        const admins = alias(users, 'admins');

        const blocks = await db.select({
            id: mentorshipBlocks.id,
            scope: mentorshipBlocks.scope,
            reason: mentorshipBlocks.reason,
            isActive: mentorshipBlocks.isActive,
            createdAt: mentorshipBlocks.createdAt,
            blockedStudent: {
                id: blockedStudents.id,
                name: blockedStudents.name,
                fullName: blockedStudents.fullName,
                email: blockedStudents.email,
            },
            blockedMentor: {
                id: blockedMentors.id,
                name: blockedMentors.name,
                fullName: blockedMentors.fullName,
                email: blockedMentors.email,
            },
            createdByAdmin: {
                id: admins.id,
                name: admins.name,
            },
        })
            .from(mentorshipBlocks)
            .leftJoin(blockedStudents, eq(mentorshipBlocks.blockedStudentId, blockedStudents.id))
            .leftJoin(blockedMentors, eq(mentorshipBlocks.blockedMentorId, blockedMentors.id))
            .leftJoin(admins, eq(mentorshipBlocks.createdByAdminId, admins.id))
            .orderBy(desc(mentorshipBlocks.createdAt));

        return NextResponse.json({ data: blocks });

    } catch (error) {
        console.error('Admin Blocks List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/mentorship/blocks — Create a block
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { scope, blockedStudentId, blockedMentorId, reason } = blockSchema.parse(body);

        // Validate scope requirements
        if (scope === 'student_global' && !blockedStudentId) {
            return NextResponse.json({ error: 'blockedStudentId is required for student_global scope' }, { status: 400 });
        }
        if (scope === 'mentor_global' && !blockedMentorId) {
            return NextResponse.json({ error: 'blockedMentorId is required for mentor_global scope' }, { status: 400 });
        }
        if (scope === 'pair_block' && (!blockedStudentId || !blockedMentorId)) {
            return NextResponse.json({ error: 'Both blockedStudentId and blockedMentorId are required for pair_block scope' }, { status: 400 });
        }

        // Validate user existence
        if (blockedStudentId) {
            const student = await db.query.users.findFirst({ where: eq(users.id, blockedStudentId) });
            if (!student) return NextResponse.json({ error: 'Blocked student not found' }, { status: 404 });
        }
        if (blockedMentorId) {
            const mentor = await db.query.users.findFirst({ where: eq(users.id, blockedMentorId) });
            if (!mentor) return NextResponse.json({ error: 'Blocked mentor not found' }, { status: 404 });
        }

        const [block] = await db.transaction(async (tx) => {
            const newBlocks = await tx.insert(mentorshipBlocks).values({
                scope,
                blockedStudentId: blockedStudentId || null,
                blockedMentorId: blockedMentorId || null,
                reason: reason || null,
                isActive: true,
                createdByAdminId: admin.id,
            }).returning();

            const newBlock = Array.isArray(newBlocks) ? newBlocks[0] : newBlocks;

            // Auto-block existing chats
            if (scope === 'pair_block' && blockedStudentId && blockedMentorId) {
                const userIds = [blockedStudentId, blockedMentorId].sort();
                const uniqueKey = `${userIds[0]}:${userIds[1]}`;

                await tx.update(conversations)
                    .set({
                        isBlocked: true,
                        blockedReason: `Mentorship blocked by admin: ${reason || 'Pair blocked'}`,
                        blockedSource: 'mentorship_block',
                        blockedByAdminId: admin.id,
                        blockedAt: new Date(),
                    })
                    .where(eq(conversations.uniqueKey, uniqueKey));
            } else if (scope === 'student_global' && blockedStudentId) {
                // Find all conversations involving this student
                const studentConvs = await tx.select({ id: conversationParticipants.conversationId })
                    .from(conversationParticipants)
                    .where(eq(conversationParticipants.userId, blockedStudentId));

                if (studentConvs.length > 0) {
                    await tx.update(conversations)
                        .set({
                            isBlocked: true,
                            blockedReason: `Student blocked by admin: ${reason || 'Global restriction'}`,
                            blockedSource: 'mentorship_block',
                            blockedByAdminId: admin.id,
                            blockedAt: new Date(),
                        })
                        .where(sql`${conversations.id} IN (${sql.join(studentConvs.map(c => sql`${c.id}`), sql`, `)})`);
                }
            } else if (scope === 'mentor_global' && blockedMentorId) {
                // Find all conversations involving this mentor
                const mentorConvs = await tx.select({ id: conversationParticipants.conversationId })
                    .from(conversationParticipants)
                    .where(eq(conversationParticipants.userId, blockedMentorId));

                if (mentorConvs.length > 0) {
                    await tx.update(conversations)
                        .set({
                            isBlocked: true,
                            blockedReason: `Mentor blocked by admin: ${reason || 'Global restriction'}`,
                            blockedSource: 'mentorship_block',
                            blockedByAdminId: admin.id,
                            blockedAt: new Date(),
                        })
                        .where(sql`${conversations.id} IN (${sql.join(mentorConvs.map(c => sql`${c.id}`), sql`, `)})`);
                }
            }

            return [newBlock];
        });

        return NextResponse.json({ success: true, data: block }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Block Create Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
