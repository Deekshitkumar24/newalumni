import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Toggle canCreateEvents for a student user (Admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Get the target user
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (targetUser.role !== 'student') {
            return NextResponse.json({ error: 'Event posting permission can only be set for students' }, { status: 400 });
        }

        const body = await req.json();
        const canCreateEvents = Boolean(body.canCreateEvents);

        await db.update(users)
            .set({ canCreateEvents, updatedAt: new Date() })
            .where(eq(users.id, id));

        return NextResponse.json({
            success: true,
            canCreateEvents,
            message: canCreateEvents
                ? `Event posting enabled for ${targetUser.email}.`
                : `Event posting disabled for ${targetUser.email}.`
        });

    } catch (error) {
        console.error('Event Permission PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
