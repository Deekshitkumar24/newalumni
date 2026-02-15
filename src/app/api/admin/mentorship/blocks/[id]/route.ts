import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipBlocks, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
    isActive: z.boolean().optional(),
    reason: z.string().optional(),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// PATCH /api/admin/mentorship/blocks/[id] — Toggle is_active or update reason
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { isActive, reason } = updateSchema.parse(body);

        const block = await db.query.mentorshipBlocks.findFirst({
            where: eq(mentorshipBlocks.id, id),
        });

        if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (reason !== undefined) updateData.reason = reason;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const [updated] = await db.update(mentorshipBlocks)
            .set(updateData)
            .where(eq(mentorshipBlocks.id, id))
            .returning();

        return NextResponse.json({ success: true, data: updated });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Block Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
