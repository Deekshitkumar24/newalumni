import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventRegistrations, events } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getAuthUser(req);

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if event exists
        const event = await db.query.events.findFirst({
            where: eq(events.id, id)
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if already registered
        const existingReg = await db.query.eventRegistrations.findFirst({
            where: and(
                eq(eventRegistrations.eventId, id),
                eq(eventRegistrations.userId, auth.id)
            )
        });

        if (existingReg) {
            return NextResponse.json({ message: 'Already registered' });
        }

        // Register
        await db.insert(eventRegistrations).values({
            eventId: id,
            userId: auth.id,
            status: 'registered'
        });

        return NextResponse.json({ success: true, message: 'Registered successfully' });

    } catch (error) {
        console.error('Event Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
