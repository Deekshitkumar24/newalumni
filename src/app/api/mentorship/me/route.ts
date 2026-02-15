import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentorshipRequests, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, desc } from 'drizzle-orm';

async function getAuthUser(req: Request) {
    try {
        const token = (req as any).cookies?.get?.('token')?.value;
        if (!token) return null;
        return verifyToken(token);
    } catch { return null; }
}

// GET: List My Mentorship Requests
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const currentUser = await db.query.users.findFirst({ where: eq(users.id, auth.id) });
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const isAlumni = currentUser.role === 'alumni';

        let results;
        if (isAlumni) {
            // Alumni sees incoming requests
            results = await db.select({
                id: mentorshipRequests.id,
                status: mentorshipRequests.status,
                message: mentorshipRequests.message,
                requestType: mentorshipRequests.requestType,
                description: mentorshipRequests.description,
                stoppedByAdmin: mentorshipRequests.stoppedByAdmin,
                stopReason: mentorshipRequests.stopReason,
                createdAt: mentorshipRequests.createdAt,
                updatedAt: mentorshipRequests.updatedAt,
                otherUser: {
                    id: users.id,
                    fullName: users.fullName,
                    name: users.name,
                    role: users.role,
                    profileImage: users.profileImage
                }
            })
                .from(mentorshipRequests)
                .innerJoin(users, eq(mentorshipRequests.studentId, users.id))
                .where(eq(mentorshipRequests.alumniId, auth.id))
                .orderBy(desc(mentorshipRequests.createdAt));
        } else {
            // Student sees outgoing requests
            results = await db.select({
                id: mentorshipRequests.id,
                status: mentorshipRequests.status,
                message: mentorshipRequests.message,
                requestType: mentorshipRequests.requestType,
                description: mentorshipRequests.description,
                stoppedByAdmin: mentorshipRequests.stoppedByAdmin,
                stopReason: mentorshipRequests.stopReason,
                createdAt: mentorshipRequests.createdAt,
                updatedAt: mentorshipRequests.updatedAt,
                otherUser: {
                    id: users.id,
                    fullName: users.fullName,
                    name: users.name,
                    role: users.role,
                    profileImage: users.profileImage
                }
            })
                .from(mentorshipRequests)
                .innerJoin(users, eq(mentorshipRequests.alumniId, users.id))
                .where(eq(mentorshipRequests.studentId, auth.id))
                .orderBy(desc(mentorshipRequests.createdAt));
        }

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('Mentorship List Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
