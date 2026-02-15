import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { signToken, signRefreshToken } from '@/lib/auth/jwt';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        const user = await db.query.users.findFirst({
            where: and(
                eq(users.email, email),
                isNull(users.deletedAt)
            ),
        });

        if (!user) {
            return NextResponse.json({
                error: 'No account found. Please register to continue.',
                code: 'ACCOUNT_NOT_FOUND'
            }, { status: 404 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({
                error: 'Incorrect password. Please try again.',
                code: 'WRONG_PASSWORD'
            }, { status: 401 });
        }

        // Status Checks
        if (user.status === 'pending') {
            return NextResponse.json({
                error: 'Your account is awaiting admin approval. You’ll be able to log in once approved.',
                code: 'PENDING_APPROVAL'
            }, { status: 403 });
        }

        if (user.status === 'rejected') {
            return NextResponse.json({
                error: 'Your registration was not approved. Please contact the administrator.',
                code: 'REJECTED'
            }, { status: 403 });
        }

        if (user.status === 'suspended') {
            return NextResponse.json({
                error: 'Your account has been suspended. Please contact the administrator.',
                code: 'SUSPENDED'
            }, { status: 403 });
        }

        // Success - Generate Tokens
        const accessToken = signToken({ id: user.id, role: user.role });
        const refreshToken = signRefreshToken({ id: user.id, role: user.role, version: 1 });

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                status: user.status
            },
            code: 'OK'
        });

        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax' as const,
            maxAge: 60 * 15, // 15 mins
            path: '/',
        };

        const refreshCookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/api/auth',
        };

        response.cookies.set('token', accessToken, cookieOptions);
        response.cookies.set('refreshToken', refreshToken, refreshCookieOptions);

        return response;

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }

        console.error('Login error:', error);

        // Check for specific DB errors (Postgres)
        // 42P01: undefined_table
        // 42703: undefined_column
        if (error.code === '42P01' || error.code === '42703' || error.message?.includes('relation') || error.message?.includes('column')) {
            console.error('CRITICAL: Database schema mismatch. Tables/Columns missing.');
            return NextResponse.json({
                error: 'System Error: Database schema not initialized. Please run migrations.',
                code: 'DB_SCHEMA_MISSING'
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
