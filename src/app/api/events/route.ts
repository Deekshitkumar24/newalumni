import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { desc, eq, and, gt, gte, lt, count, sql } from 'drizzle-orm';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Helper for pagination
const createEventSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    date: z.coerce.date(),
    venue: z.string().min(3),
    posterUrl: z.string().url().optional().or(z.literal('')),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List Events
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'upcoming' | 'past'
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        const conditions = [];

        if (type === 'upcoming') {
            conditions.push(gte(events.date, new Date()));
        } else if (type === 'past') {
            conditions.push(lt(events.date, new Date()));
        }

        const results = await db.select({
            id: events.id,
            title: events.title,
            description: events.description,
            date: events.date,
            venue: events.venue,
            posterUrl: events.posterUrl,
            createdAt: events.createdAt,
            creator: {
                id: users.id,
                name: users.name
            }
        })
            .from(events)
            .leftJoin(users, eq(events.creatorId, users.id))
            .where(and(...conditions))
            .orderBy(type === 'upcoming' ? events.date : desc(events.date))
            .limit(limit)
            .offset(offset);

        // Get Total Count
        const totalRes = await db.select({ count: count() }).from(events).where(and(...conditions));
        const total = totalRes[0]?.count || 0;

        return NextResponse.json({
            data: results.map(e => ({ ...e, registrations: [] })), // Mock registrations
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Events GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create Event (Admin/Alumni)
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || (auth.role !== 'admin' && auth.role !== 'alumni')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const data = createEventSchema.parse(body);

        const [newEvent] = await db.insert(events).values({
            ...data,
            creatorId: auth.id,
            posterUrl: data.posterUrl || null
        }).returning();

        return NextResponse.json(newEvent, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Events POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
