import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema'; // Ensure users table is imported correctly
import { signToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        // 1. Get Refresh Token from Cookie
        // Note: In App Router, we use cookies() helper or req.cookies
        // req.cookies is available on the Request object in Next.js
        const cookieStore = (req as any).cookies; // Type cast if needed, or use proper NextRequest type
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
        }

        // 2. Verify Token
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
        }

        // 3. Check User Status
        const user = await db.query.users.findFirst({
            where: (userTable: any, { eq, and, isNull }: any) => and(
                eq(userTable.id, payload.id),
                isNull(userTable.deletedAt)
            ),
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        if (user.status === 'suspended' || user.status === 'rejected') {
            return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }

        // 4. Issue New Tokens (Rotation)
        const newAccessToken = signToken({ id: user.id, role: user.role });
        const newRefreshToken = signRefreshToken({ id: user.id, role: user.role, version: (payload.version || 0) + 1 });

        const response = NextResponse.json({
            accessToken: newAccessToken
        });

        // 5. Set Cookies
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookies.set('token', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 15, // 15 mins
            path: '/',
        });

        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/api/auth',
        });

        return response;

    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
