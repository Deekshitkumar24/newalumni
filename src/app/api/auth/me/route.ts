import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch fresh status from DB to ensure suspension is effective immediately
        const [freshUser] = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            status: users.status,
            profileImage: users.profileImage
        })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!freshUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Enforce status check on 'me' endpoint too
        if (freshUser.status === 'suspended' || freshUser.status === 'rejected') {
            return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }

        if (freshUser.status === 'pending') {
            return NextResponse.json({ error: 'Account pending' }, { status: 403 });
        }

        return NextResponse.json({ user: freshUser });
    } catch (error) {
        console.error('Me API Error', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
