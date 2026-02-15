import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development-only';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    console.log(`[Middleware] Checking request for: ${pathname}`);
    // Bypass Auth for Debugging
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
