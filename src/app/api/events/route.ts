import { NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users, eventInvitations, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { desc, eq, and, gte, lt, count, sql, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createEventSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    date: z.coerce.date(),
    venue: z.string().min(3),
    posterUrl: z.string().url().optional().or(z.literal('')),
    visibility: z.enum(['public', 'students_only', 'invite_only']).default('public'),
    invitedMentorIds: z.array(z.string().uuid()).optional(),
    invitationMessage: z.string().optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List Events (with visibility filtering)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'upcoming' | 'past'
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        const conditions: any[] = [];

        if (type === 'upcoming') {
            conditions.push(gte(events.date, new Date()));
        } else if (type === 'past') {
            conditions.push(lt(events.date, new Date()));
        }

        // Build visibility filter based on user role
        if (auth) {
            if (auth.role === 'admin') {
                // Admin sees everything — no visibility filter
            } else if (auth.role === 'student') {
                // Students see PUBLIC + STUDENTS_ONLY + events they created
                conditions.push(
                    or(
                        eq(events.visibility, 'public'),
                        eq(events.visibility, 'students_only'),
                        eq(events.creatorId, auth.id)
                    )
                );
            } else if (auth.role === 'alumni') {
                // Alumni see PUBLIC + events they created + INVITE_ONLY where they have an accepted invitation
                const acceptedInvitations = await db.select({ eventId: eventInvitations.eventId })
                    .from(eventInvitations)
                    .where(and(
                        eq(eventInvitations.invitedUserId, auth.id),
                        eq(eventInvitations.status, 'accepted')
                    ));
                const acceptedEventIds = acceptedInvitations.map(i => i.eventId);

                if (acceptedEventIds.length > 0) {
                    conditions.push(
                        or(
                            eq(events.visibility, 'public'),
                            eq(events.creatorId, auth.id),
                            and(
                                eq(events.visibility, 'invite_only'),
                                inArray(events.id, acceptedEventIds)
                            )
                        )
                    );
                } else {
                    conditions.push(
                        or(
                            eq(events.visibility, 'public'),
                            eq(events.creatorId, auth.id)
                        )
                    );
                }
            }
        } else {
            // Unauthenticated users see only public events
            conditions.push(eq(events.visibility, 'public'));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db.select({
            id: events.id,
            title: events.title,
            description: events.description,
            date: events.date,
            venue: events.venue,
            posterUrl: events.posterUrl,
            visibility: events.visibility,
            createdAt: events.createdAt,
            creatorId: events.creatorId,
            creator: {
                id: users.id,
                name: users.name
            }
        })
            .from(events)
            .leftJoin(users, eq(events.creatorId, users.id))
            .where(whereClause)
            .orderBy(type === 'upcoming' ? events.date : desc(events.date))
            .limit(limit)
            .offset(offset);

        // Get Total Count
        const totalRes = await db.select({ count: count() }).from(events).where(whereClause);
        const total = totalRes[0]?.count || 0;

        return NextResponse.json({
            data: results.map(e => ({ ...e, registrations: [] })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Events GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create Event (Admin, Alumni, or permitted Students)
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (auth.role === 'student') {
            // Check if student has canCreateEvents permission
            const studentUser = await db.query.users.findFirst({
                where: eq(users.id, auth.id),
            });
            if (!studentUser || !studentUser.canCreateEvents) {
                return NextResponse.json({ error: 'You don\'t have permission to create events. Please contact the administrator.' }, { status: 403 });
            }
        } else if (auth.role !== 'admin' && auth.role !== 'alumni') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const data = createEventSchema.parse(body);

        const [newEvent] = await db.insert(events).values({
            title: data.title,
            description: data.description,
            date: data.date,
            venue: data.venue,
            posterUrl: data.posterUrl || null,
            visibility: data.visibility,
            creatorId: auth.id,
        }).returning();

        // If invite_only, create invitations for selected mentors
        if (data.visibility === 'invite_only' && data.invitedMentorIds && data.invitedMentorIds.length > 0) {
            const invitationRows = data.invitedMentorIds.map(mentorId => ({
                eventId: newEvent.id,
                invitedUserId: mentorId,
                invitedByUserId: auth.id,
                message: data.invitationMessage || null,
            }));

            await db.insert(eventInvitations).values(invitationRows);

            // Create notifications for each invited mentor
            try {
                const notificationRows = data.invitedMentorIds.map(mentorId => ({
                    recipientId: mentorId,
                    type: 'event_invitation' as const,
                    referenceId: newEvent.id,
                    title: 'Event Invitation',
                    message: `You have been invited to "${newEvent.title}"`,
                }));

                await db.insert(notifications).values(notificationRows);
            } catch (notifError) {
                console.error('Failed to create invitation notifications:', notifError);
                // Don't fail the event creation if notifications fail
            }
        }

        return NextResponse.json(newEvent, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Events POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
