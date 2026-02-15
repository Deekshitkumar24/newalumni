import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipRequests, mentorshipBlocks, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const requestSchema = z.object({
    mentorId: z.string().uuid(),
    requestType: z.string().min(1, 'Request type is required'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
});

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// POST: Request Mentorship (Student only)
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Validate Student
        const student = await db.query.users.findFirst({
            where: eq(users.id, auth.id),
        });

        if (!student || student.status !== 'approved' || student.deletedAt) {
            return NextResponse.json({ error: 'Account not eligible' }, { status: 403 });
        }
        if (student.role !== 'student') {
            return NextResponse.json({ error: 'Only students can request mentorship' }, { status: 403 });
        }

        const body = await req.json();
        const { mentorId, requestType, description } = requestSchema.parse(body);

        if (student.id === mentorId) {
            return NextResponse.json({ error: 'Cannot request mentorship from self' }, { status: 400 });
        }

        // 2. Validate Alumni
        const alumni = await db.query.users.findFirst({
            where: eq(users.id, mentorId),
        });

        if (!alumni || alumni.role !== 'alumni' || alumni.status !== 'approved' || alumni.deletedAt) {
            return NextResponse.json({ error: 'Mentor not available' }, { status: 404 });
        }

        // 3. Block Checks
        // 3a. Student global block
        const studentGlobalBlock = await db.query.mentorshipBlocks.findFirst({
            where: and(
                eq(mentorshipBlocks.scope, 'student_global'),
                eq(mentorshipBlocks.blockedStudentId, student.id),
                eq(mentorshipBlocks.isActive, true)
            ),
        });
        if (studentGlobalBlock) {
            return NextResponse.json({
                error: 'You are currently blocked from sending mentorship requests',
                reason: studentGlobalBlock.reason
            }, { status: 403 });
        }

        // 3b. Mentor global block
        const mentorGlobalBlock = await db.query.mentorshipBlocks.findFirst({
            where: and(
                eq(mentorshipBlocks.scope, 'mentor_global'),
                eq(mentorshipBlocks.blockedMentorId, mentorId),
                eq(mentorshipBlocks.isActive, true)
            ),
        });
        if (mentorGlobalBlock) {
            return NextResponse.json({ error: 'This mentor is currently unavailable' }, { status: 403 });
        }

        // 3c. Pair block
        const pairBlock = await db.query.mentorshipBlocks.findFirst({
            where: and(
                eq(mentorshipBlocks.scope, 'pair_block'),
                eq(mentorshipBlocks.blockedStudentId, student.id),
                eq(mentorshipBlocks.blockedMentorId, mentorId),
                eq(mentorshipBlocks.isActive, true)
            ),
        });
        if (pairBlock) {
            return NextResponse.json({
                error: 'You are blocked from requesting mentorship from this mentor'
            }, { status: 403 });
        }

        // 4. Check Duplicate Pending Request
        const existing = await db.query.mentorshipRequests.findFirst({
            where: and(
                eq(mentorshipRequests.studentId, student.id),
                eq(mentorshipRequests.alumniId, mentorId),
                eq(mentorshipRequests.status, 'pending')
            ),
        });

        if (existing) {
            return NextResponse.json({ error: 'A pending request already exists for this mentor' }, { status: 409 });
        }

        // 5. Create Request
        const [newRequest] = await db.insert(mentorshipRequests).values({
            studentId: student.id,
            alumniId: mentorId,
            message: description, // backward compat
            requestType,
            description,
            status: 'pending',
        }).returning();

        // 6. Notify Alumni
        await createNotification({
            recipientId: mentorId,
            type: 'mentorship_request',
            title: 'New Mentorship Request',
            message: `${student.name} sent a ${requestType} request: "${description.substring(0, 80)}..."`,
            referenceId: newRequest.id,
            metadata: {
                requestId: newRequest.id,
                studentId: student.id,
                requestType
            }
        });

        return NextResponse.json({ success: true, data: newRequest }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error.code === '23505') {
            return NextResponse.json({ error: 'A pending request already exists for this mentor' }, { status: 409 });
        }
        console.error('Mentorship Request Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
