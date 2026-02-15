import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = performance.now();
        await db.execute(sql`SELECT 1`);
        const duration = Math.round(performance.now() - start);

        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            latency: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Health Check Failed:', error);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        }, { status: 500 });
    }
}
