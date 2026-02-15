import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipRequests, users, conversations } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const actionSchema = z.object({
    action: z.enum(['force_stop', 'clear_stop']),
    reason: z.string().optional(),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// PATCH /api/admin/mentorship/requests/[id] — Admin force-stop or clear-stop
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, reason } = actionSchema.parse(body);

        // Fetch request
        const request = await db.query.mentorshipRequests.findFirst({
            where: eq(mentorshipRequests.id, id),
        });

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        if (action === 'force_stop') {
            if (!reason || reason.trim().length === 0) {
                return NextResponse.json({ error: 'Reason is required for force stop' }, { status: 400 });
            }

            const now = new Date();
            const [updated] = await db.update(mentorshipRequests)
                .set({
                    stoppedByAdmin: true,
                    stopReason: reason.trim(),
                    stoppedAt: now,
                    reviewedByAdminId: admin.id,
                    reviewedAt: now,
                    status: 'cancelled',
                    updatedAt: now,
                })
                .where(eq(mentorshipRequests.id, id))
                .returning();

            console.log('[Admin Force Stop]', { requestId: id, action: 'force_stop', adminId: admin.id, updated: !!updated });

            // BLOCK CHAT: Find and block direct conversation
            try {
                const userIds = [request.studentId, request.alumniId].sort();
                const uniqueKey = `${userIds[0]}:${userIds[1]}`;

                const [chatBlocked] = await db.update(conversations)
                    .set({
                        isBlocked: true,
                        blockedReason: `Mentorship stopped by admin: ${reason.trim()}`,
                        blockedSource: 'mentorship_force_stop',
                        blockedByAdminId: admin.id,
                        blockedAt: new Date(),
                    })
                    .where(eq(conversations.uniqueKey, uniqueKey))
                    .returning();

                if (chatBlocked) {
                    console.log('[Chat Blocked]', { conversationId: chatBlocked.id, reason: reason.trim() });
                }
            } catch (chatError) {
                console.error('Failed to block chat after force stop:', chatError);
                // Don't fail the request, just log
            }

            // Notify Student
            await createNotification({
                recipientId: request.studentId,
                type: 'mentorship_force_stopped',
                title: 'Mentorship Stopped by Admin',
                message: `Your mentorship with the alumni has been stopped. Reason: ${reason}`,
                referenceId: request.id,
                metadata: { reason, stoppedByAdmin: true }
            });

            // Notify Mentor
            await createNotification({
                recipientId: request.alumniId,
                type: 'mentorship_force_stopped',
                title: 'Mentorship Stopped by Admin',
                message: `The mentorship request has been stopped. Reason: ${reason}`,
                referenceId: request.id,
                metadata: { reason, stoppedByAdmin: true }
            });

            return NextResponse.json({ success: true, data: updated });
        }

        if (action === 'clear_stop') {
            const now = new Date();
            const [updated] = await db.update(mentorshipRequests)
                .set({
                    stoppedByAdmin: false,
                    stopReason: null,
                    stoppedAt: null,
                    reviewedByAdminId: admin.id,
                    reviewedAt: now,
                    updatedAt: now,
                })
                .where(eq(mentorshipRequests.id, id))
                .returning();

            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Mentorship Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
