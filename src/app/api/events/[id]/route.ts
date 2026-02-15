import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users } from '@/db/schema';
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

// GET: Single Event
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getAuthUser(req);

        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Get registration count
        const { eventRegistrations } = await import('@/db/schema');
        const { count } = await import('drizzle-orm'); // count is not exported from drizzle-orm top level usually, use sql or count() fn
        // actually easier to use db.select({ count: sql<number>`count(*)` })

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

        return NextResponse.json({
            ...event,
            registrationsCount: Number(regCount.count),
            isRegistered,
            // Add creator info if needed? UI showed it might be useful but redundant?
            // Let's stick to what's here + reg info.
        });

    } catch (error) {
        console.error("Event Detail API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete Event (Admin or Creator)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
