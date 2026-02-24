import { NextResponse } from 'next/server';
import { db } from '@/db';
import { suggestions, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const updateSuggestionSchema = z.object({
    status: z.enum(['NEW', 'IN_REVIEW', 'PLANNED', 'DONE', 'REJECTED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    adminResponse: z.string().optional(),
});

async function getAuthUser(req: Request) {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    if (!tokenMatch) return null;
    const token = tokenMatch[1];
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const [suggestion] = await db
            .select({
                id: suggestions.id,
                createdByUserId: suggestions.createdByUserId,
                title: suggestions.title,
                description: suggestions.description,
                category: suggestions.category,
                status: suggestions.status,
                priority: suggestions.priority,
                adminResponse: suggestions.adminResponse,
                screenshotUrl: suggestions.screenshotUrl,
                createdAt: suggestions.createdAt,
                updatedAt: suggestions.updatedAt,
                creatorName: users.name,
                creatorEmail: users.email,
                creatorRole: users.role,
            })
            .from(suggestions)
            .leftJoin(users, eq(suggestions.createdByUserId, users.id))
            .where(eq(suggestions.id, id));

        if (!suggestion) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        // Non-admin can only access their own
        if (auth.role !== 'admin' && suggestion.createdByUserId !== auth.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ data: suggestion });
    } catch (error) {
        console.error('Suggestion GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Check suggestion exists
        const [existing] = await db
            .select()
            .from(suggestions)
            .where(eq(suggestions.id, id));

        if (!existing) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        const body = await req.json();
        const data = updateSuggestionSchema.parse(body);

        const updateValues: any = {
            updatedAt: new Date(),
        };

        if (data.status !== undefined) updateValues.status = data.status;
        if (data.priority !== undefined) updateValues.priority = data.priority;
        if (data.adminResponse !== undefined) updateValues.adminResponse = data.adminResponse;

        const [updated] = await db
            .update(suggestions)
            .set(updateValues)
            .where(eq(suggestions.id, id))
            .returning();

        // Notify the suggestion creator about the update
        try {
            const statusChanged = data.status && data.status !== existing.status;
            const responseAdded = data.adminResponse && data.adminResponse !== existing.adminResponse;

            if (statusChanged || responseAdded) {
                let message = '';
                if (statusChanged) {
                    message = `Your suggestion "${existing.title}" status was updated to ${data.status}.`;
                }
                if (responseAdded) {
                    message = message
                        ? `${message} An admin also responded.`
                        : `An admin responded to your suggestion "${existing.title}".`;
                }

                await createNotification({
                    recipientId: existing.createdByUserId,
                    type: 'system_alert',
                    title: 'Suggestion Updated',
                    message,
                    referenceId: existing.id,
                });
            }
        } catch (notifError) {
            console.error('Failed to send notification for suggestion update:', notifError);
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Suggestion PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
