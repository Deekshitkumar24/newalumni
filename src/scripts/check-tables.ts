
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Manual env loader fallback
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
            }
        });
    } catch (e) {
        console.error('Failed to load .env', e);
    }
}

async function checkTables() {
    const { db } = await import('@/db');
    console.log('Checking tables...');
    try {
        const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log('Tables found:', result.rows.map((r: any) => r.table_name));
    } catch (error) {
        console.error('Error checking tables:', error);
    }
    process.exit(0);
}

checkTables();
