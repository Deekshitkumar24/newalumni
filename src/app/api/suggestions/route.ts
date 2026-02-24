import { NextResponse } from 'next/server';
import { db } from '@/db';
import { suggestions, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const createSuggestionSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(['BUG', 'FEATURE', 'UX', 'CONTENT', 'OTHER']).default('OTHER'),
    screenshotUrl: z.string().url().optional().or(z.literal('')),
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

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');
        const categoryFilter = searchParams.get('category');
        const priorityFilter = searchParams.get('priority');
        const searchQuery = searchParams.get('search');
        const isAdmin = auth.role === 'admin';

        const conditions: any[] = [];

        // Non-admin: only own suggestions
        if (!isAdmin) {
            conditions.push(eq(suggestions.createdByUserId, auth.id));
        }

        // Filters
        if (statusFilter) {
            conditions.push(eq(suggestions.status, statusFilter as any));
        }
        if (categoryFilter) {
            conditions.push(eq(suggestions.category, categoryFilter as any));
        }
        if (priorityFilter) {
            conditions.push(eq(suggestions.priority, priorityFilter as any));
        }
        if (searchQuery) {
            conditions.push(
                or(
                    ilike(suggestions.title, `%${searchQuery}%`),
                    ilike(suggestions.description, `%${searchQuery}%`)
                )
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (isAdmin) {
            // Admin: join with users for creator info
            const results = await db
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
                .where(whereClause)
                .orderBy(desc(suggestions.createdAt));

            return NextResponse.json({ data: results });
        } else {
            const results = await db
                .select()
                .from(suggestions)
                .where(whereClause)
                .orderBy(desc(suggestions.createdAt));

            return NextResponse.json({ data: results });
        }
    } catch (error) {
        console.error('Suggestions GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admins cannot submit suggestions — they can only review/manage
        if (auth.role === 'admin') {
            return NextResponse.json(
                { code: 'ADMIN_CANNOT_SUBMIT', error: 'Admins cannot submit suggestions.' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const data = createSuggestionSchema.parse(body);

        const [newSuggestion] = await db.insert(suggestions).values({
            createdByUserId: auth.id,
            title: data.title,
            description: data.description,
            category: data.category,
            screenshotUrl: data.screenshotUrl || null,
        }).returning();

        // Notify all admins about the new suggestion
        try {
            const adminUsers = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.role, 'admin'));

            for (const admin of adminUsers) {
                await createNotification({
                    recipientId: admin.id,
                    type: 'system_alert',
                    title: 'New Suggestion Submitted',
                    message: `A new suggestion "${data.title}" has been submitted.`,
                    referenceId: newSuggestion.id,
                });
            }
        } catch (notifError) {
            console.error('Failed to send notifications for new suggestion:', notifError);
            // Don't fail the main request
        }

        return NextResponse.json({ success: true, data: newSuggestion }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Suggestions POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
