import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users, eventInvitations, eventRegistrations } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

const updateEventSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    date: z.coerce.date().optional(),
    venue: z.string().min(3).optional(),
    posterUrl: z.string().url().optional().or(z.literal('')),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// Check if user can view this event based on visibility rules
async function canUserViewEvent(event: any, auth: any): Promise<boolean> {
    if (!event) return false;

    // Admin can see everything
    if (auth?.role === 'admin') return true;

    // Creator can always see their own event
    if (auth && event.creatorId === auth.id) return true;

    switch (event.visibility) {
        case 'public':
            return true;

        case 'students_only':
            return auth?.role === 'student';

        case 'invite_only':
            if (!auth || auth.role !== 'alumni') return false;
            // Check if alumni has an accepted invitation
            const invitation = await db.query.eventInvitations.findFirst({
                where: and(
                    eq(eventInvitations.eventId, event.id),
                    eq(eventInvitations.invitedUserId, auth.id),
                    eq(eventInvitations.status, 'accepted')
                )
            });
            return !!invitation;

        default:
            return true;
    }
}

// GET: Single Event (with visibility enforcement)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getAuthUser(req);

        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Enforce visibility — return 404 to avoid leaking existence
        const canView = await canUserViewEvent(event, auth);
        if (!canView) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Get registration count
        const [regCount] = await db.select({ count: sql<number>`count(*)` })
            .from(eventRegistrations)
            .where(eq(eventRegistrations.eventId, id));

        let isRegistered = false;
        if (auth) {
            const checkReg = await db.query.eventRegistrations.findFirst({
                where: and(
                    eq(eventRegistrations.eventId, id),
                    eq(eventRegistrations.userId, auth.id)
                )
            });
            if (checkReg) isRegistered = true;
        }

        // Get invitation info for invite_only events if user is admin or creator
        let invitations: any[] = [];
        if (event.visibility === 'invite_only' && auth && (auth.role === 'admin' || event.creatorId === auth.id)) {
            invitations = await db.select({
                id: eventInvitations.id,
                status: eventInvitations.status,
                message: eventInvitations.message,
                createdAt: eventInvitations.createdAt,
                respondedAt: eventInvitations.respondedAt,
                invitedUser: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    profileImage: users.profileImage,
                },
            })
                .from(eventInvitations)
                .leftJoin(users, eq(eventInvitations.invitedUserId, users.id))
                .where(eq(eventInvitations.eventId, id));
        }

        return NextResponse.json({
            ...event,
            registrationsCount: Number(regCount.count),
            isRegistered,
            invitations,
        });

    } catch (error) {
        console.error("Event Detail API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete Event (Admin or Creator)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const event = await db.query.events.findFirst({ where: eq(events.id, id) });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        if (auth.role !== 'admin' && event.creatorId !== auth.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.delete(events).where(eq(events.id, id));
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH: Update Event (Admin or Creator)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const event = await db.query.events.findFirst({ where: eq(events.id, id) });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        if (auth.role !== 'admin' && event.creatorId !== auth.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const data = updateEventSchema.parse(body);

        await db.update(events)
            .set({
                ...data,
                posterUrl: data.posterUrl || event.posterUrl
            })
            .where(eq(events.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
