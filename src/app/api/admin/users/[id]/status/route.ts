import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, auditLogs } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const statusSchema = z.object({
    status: z.enum(['approved', 'rejected', 'suspended']),
});

// Allowed transitions map
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['approved', 'rejected'],
    approved: ['suspended'],
    suspended: ['approved'],
};

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Update User Status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: targetId } = await params;
        const body = await req.json();
        const { status: newStatus } = statusSchema.parse(body);

        // Cannot modify own status
        if (auth.id === targetId) {
            return NextResponse.json({ error: 'Cannot modify your own status' }, { status: 400 });
        }

        // Fetch target user
        const [target] = await db.select({ id: users.id, status: users.status, role: users.role })
            .from(users).where(eq(users.id, targetId)).limit(1);

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate transition
        const allowed = ALLOWED_TRANSITIONS[target.status] || [];
        if (!allowed.includes(newStatus)) {
            return NextResponse.json({
                error: `Invalid transition: ${target.status} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`
            }, { status: 400 });
        }

        // Update status + audit log in transaction
        await db.transaction(async (tx) => {
            await tx.update(users)
                .set({ status: newStatus as any, updatedAt: new Date() })
                .where(eq(users.id, targetId));

            await tx.insert(auditLogs).values({
                actorId: auth.id,
                action: `user_status_change`,
                targetId: targetId,
                metadata: { from: target.status, to: newStatus },
            });
        });

        return NextResponse.json({ success: true, from: target.status, to: newStatus });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Admin Status Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Soft Delete User
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: targetId } = await params;

        // Cannot delete self
        if (auth.id === targetId) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Fetch target user
        const [target] = await db.select({ id: users.id, deletedAt: users.deletedAt })
            .from(users).where(eq(users.id, targetId)).limit(1);

        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (target.deletedAt) {
            return NextResponse.json({ error: 'User already deleted' }, { status: 400 });
        }

        // Soft delete + audit log
        await db.transaction(async (tx) => {
            await tx.update(users)
                .set({ deletedAt: new Date(), updatedAt: new Date() })
                .where(eq(users.id, targetId));

            await tx.insert(auditLogs).values({
                actorId: auth.id,
                action: 'user_soft_delete',
                targetId: targetId,
            });
        });

        return NextResponse.json({ success: true, message: 'User soft-deleted' });

    } catch (error) {
        console.error('Admin Soft Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
