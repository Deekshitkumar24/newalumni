import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eventInvitations, events, users, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List invitations for the logged-in alumni user
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (auth.role !== 'alumni' && auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const invitations = await db.select({
            id: eventInvitations.id,
            status: eventInvitations.status,
            message: eventInvitations.message,
            createdAt: eventInvitations.createdAt,
            respondedAt: eventInvitations.respondedAt,
            event: {
                id: events.id,
                title: events.title,
                description: events.description,
                date: events.date,
                venue: events.venue,
            },
            invitedBy: {
                id: users.id,
                name: users.name,
                email: users.email,
            },
        })
            .from(eventInvitations)
            .leftJoin(events, eq(eventInvitations.eventId, events.id))
            .leftJoin(users, eq(eventInvitations.invitedByUserId, users.id))
            .where(eq(eventInvitations.invitedUserId, auth.id))
            .orderBy(desc(eventInvitations.createdAt));

        return NextResponse.json({ data: invitations });

    } catch (error) {
        console.error('Invitations GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
