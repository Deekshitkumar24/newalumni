import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notices } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createNoticeSchema = z.object({
    title: z.string().min(3),
    content: z.string().min(5),
    type: z.enum(['general', 'event', 'news', 'important']),
    isActive: z.boolean().default(true),
    // date field is in schema but typically created_at is fine, or manual date. 
    // Schema says `date` (timestamp) needs to be passed? 
    // Checking schema: `date: timestamp('date').notNull(),` - Wait, schema.ts line 108 says `date` field exists for notices?
    // Let me check schema again. Yes 'date' is string in type definition but timestamp in schema?
    // Schema line 151 in types/index.ts says `date: string`.
    // Schema line 107 in db/schema.ts says `date: timestamp('date').notNull()`.
    // Wait, step 546 schema dump doesn't show `date` in `notices` table definition?
    // Line 104 `notices` table: id, title, content, type, isActive, createdAt.
    // IT DOES NOT HAVE `date` COLUMN in schema.ts dump!
    // But types/index.ts has `date`.
    // I should probably remove `date` from types or add it to schema. 
    // For now, I will NOT include date in insert if it's not in schema.
});

// Re-checking schema dump from step 546:
// export const notices = pgTable('notices', {
//     id: uuid('id').defaultRandom().primaryKey(),
//     title: varchar('title').notNull(),
//     content: text('content').notNull(),
//     type: varchar('type').default('general').notNull(),
//     isActive: boolean('is_active').default(true).notNull(),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
// });
// So no 'date' column.

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const adminMode = searchParams.get('admin') === 'true';

        const conditions = [];
        if (!adminMode) {
            conditions.push(eq(notices.isActive, true));
        }

        const results = await db.select()
            .from(notices)
            .where(and(...conditions))
            .orderBy(desc(notices.createdAt));

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('Notices GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const data = createNoticeSchema.parse(body);

        const [newNotice] = await db.insert(notices).values({
            title: data.title,
            content: data.content,
            type: data.type,
            isActive: data.isActive
        }).returning();

        return NextResponse.json({ success: true, data: newNotice }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
