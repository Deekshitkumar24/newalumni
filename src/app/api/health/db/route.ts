import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Basic connectivity check
        const start = performance.now();
        await db.execute(sql`SELECT 1`);
        const latency = Math.round(performance.now() - start);

        const { searchParams } = new URL(req.url);
        const showSchema = searchParams.get('schema') === 'true';

        if (!showSchema) {
            return NextResponse.json({
                status: 'ok',
                database: 'connected',
                latency: `${latency}ms`,
                timestamp: new Date().toISOString(),
            });
        }

        // -----------------------------------------------------------------------
        // Schema diagnostics — only table/column existence, no data exposed
        // -----------------------------------------------------------------------
        const requiredTables = ['users', 'student_profiles', 'alumni_profiles'];

        // Check which tables exist
        const tableResult = await db.execute(sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY(ARRAY[${sql.raw(requiredTables.map(t => `'${t}'`).join(','))}])
        `);
        const tableRows: any[] = ((tableResult as unknown) as any).rows ?? (tableResult as unknown as any[]);
        const existingTables = new Set(tableRows.map((r: any) => r.table_name));

        // Check jsonb types for skills / interests on student_profiles
        const colResult = await db.execute(sql`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'student_profiles'
              AND column_name IN ('skills', 'interests')
        `);
        const colRows: any[] = ((colResult as unknown) as any).rows ?? (colResult as unknown as any[]);
        const colTypes: Record<string, string> = {};
        for (const row of colRows) {
            colTypes[row.column_name] = row.udt_name || row.data_type;
        }

        // Build per-table diagnostic
        const schemaDiag: Record<string, any> = {};
        for (const t of requiredTables) {
            schemaDiag[t] = { exists: existingTables.has(t) };
        }
        if (schemaDiag['student_profiles'].exists) {
            schemaDiag['student_profiles'].skills_type = colTypes['skills'] ?? 'missing';
            schemaDiag['student_profiles'].interests_type = colTypes['interests'] ?? 'missing';
        }

        // Detect any missing tables / wrong column types
        const missingTables = requiredTables.filter(t => !existingTables.has(t));
        const badTypes = ['skills', 'interests'].filter(c => colTypes[c] && colTypes[c] !== 'jsonb');
        const hasIssues = missingTables.length > 0 || badTypes.length > 0;

        if (hasIssues) {
            console.error('CRITICAL: Schema issues detected.', {
                missingTables,
                badColumnTypes: badTypes,
                fix: "Run 'npx drizzle-kit push' to apply migrations.",
            });
        }

        return NextResponse.json({
            status: hasIssues ? 'schema_error' : 'ok',
            database: 'connected',
            latency: `${latency}ms`,
            timestamp: new Date().toISOString(),
            schema: schemaDiag,
            ...(hasIssues ? {
                issues: {
                    missingTables,
                    badColumnTypes: badTypes,
                    fix: "Run 'npx drizzle-kit push' to apply migrations.",
                },
            } : {}),
        }, { status: hasIssues ? 500 : 200 });

    } catch (error: any) {
        console.error('[Health Check Failed]', error?.message);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
        }, { status: 500 });
    }
}
