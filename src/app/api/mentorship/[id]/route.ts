import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipRequests, users, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const updateSchema = z.object({
    status: z.enum(['accepted', 'rejected', 'cancelled']),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// PATCH: Accept/Reject/Cancel Request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { status } = updateSchema.parse(body);

        // 1. Fetch Request
        const request = await db.query.mentorshipRequests.findFirst({
            where: eq(mentorshipRequests.id, id),
        });

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        // 2. Determine action based on caller role
        const currentUser = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (status === 'cancelled') {
            // Student cancel — only the student who created the request
            if (request.studentId !== auth.id) {
                return NextResponse.json({ error: 'Only the requesting student can cancel' }, { status: 403 });
            }
            if (request.status !== 'pending') {
                return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 400 });
            }
        } else {
            // Alumni accept/reject
            if (request.alumniId !== auth.id) {
                return NextResponse.json({ error: 'Only the target mentor can accept or reject' }, { status: 403 });
            }
            if (request.status !== 'pending') {
                return NextResponse.json({ error: 'Request already resolved' }, { status: 400 });
            }
            // Block if admin has stopped
            if (request.stoppedByAdmin) {
                console.log('[Alumni Action Blocked]', { requestId: id, attemptedStatus: status, userId: auth.id, stoppedByAdmin: true });
                return NextResponse.json({
                    error: 'This request has been stopped by an administrator and cannot be modified',
                    stopReason: request.stopReason
                }, { status: 403 });
            }
        }

        // 3. Update Status & Notify (Transaction)
        await db.transaction(async (tx) => {
            await tx.update(mentorshipRequests)
                .set({ status, updatedAt: new Date() })
                .where(eq(mentorshipRequests.id, id));

            if (status === 'accepted' || status === 'rejected') {
                // Determine notification type
                const type = status === 'accepted' ? 'mentorship_accepted' : 'mentorship_rejected';

                await createNotification({
                    recipientId: request.studentId,
                    type,
                    title: `Mentorship ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
                    message: `Your mentorship request was ${status}`,
                    referenceId: request.id,
                    metadata: {
                        requestId: request.id,
                        status
                    }
                });
            }
        });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Mentorship Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
