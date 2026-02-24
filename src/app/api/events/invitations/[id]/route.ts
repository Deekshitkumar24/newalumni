import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventInvitations, events, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Accept or Decline an invitation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!['accepted', 'declined'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Must be "accepted" or "declined".' }, { status: 400 });
        }

        // Get the invitation and verify it belongs to the current user
        const invitation = await db.query.eventInvitations.findFirst({
            where: and(
                eq(eventInvitations.id, id),
                eq(eventInvitations.invitedUserId, auth.id)
            )
        });

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        if (invitation.status !== 'pending') {
            return NextResponse.json({ error: 'Invitation has already been responded to' }, { status: 400 });
        }

        await db.update(eventInvitations)
            .set({ status, respondedAt: new Date() })
            .where(eq(eventInvitations.id, id));

        // Notify the event creator
        try {
            const event = await db.query.events.findFirst({
                where: eq(events.id, invitation.eventId)
            });

            if (event) {
                const notifType = status === 'accepted' ? 'event_invitation_accepted' : 'event_invitation_declined';
                await db.insert(notifications).values({
                    recipientId: event.creatorId,
                    type: notifType as any,
                    referenceId: event.id,
                    title: status === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined',
                    message: status === 'accepted'
                        ? `A mentor has accepted your invitation to "${event.title}".`
                        : `A mentor has declined your invitation to "${event.title}".`,
                });
            }
        } catch (notifError) {
            console.error('Failed to create response notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            status,
            message: status === 'accepted'
                ? 'Invitation accepted. You can now view this event.'
                : 'Invitation declined.'
        });

    } catch (error) {
        console.error('Invitation PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
