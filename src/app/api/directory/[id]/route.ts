import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const user = await db.query.users.findFirst({
            where: (users, { eq, and }) => and(
                eq(users.id, id),
                isNull(users.deletedAt)
            ),
            with: {
                studentProfile: true, // Auto-fetched if relation exists
                alumniProfile: true,
            },
            columns: {
                passwordHash: false,
                deletedAt: false,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return flattened or structured data.
        // For consistency with directory/list, maybe flatten?
        // But for detail view, returning nested profile is fine and cleaner.

        let profileData = null;
        if (user.role === 'student') {
            profileData = user.studentProfile;
        } else if (user.role === 'alumni') {
            profileData = user.alumniProfile;
        }

        return NextResponse.json({
            ...user,
            profile: profileData
        });

    } catch (error) {
        console.error('Directory ID API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
