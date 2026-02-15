
import { db } from '../db';
import { users } from '../db/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        console.log('Connecting to DB at:', process.env.DATABASE_URL?.split('@')[1]); // Log host only for safety

        // Check if users table exists
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        console.log('Users count:', result[0].count);

        console.log('✅ Connection successful!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
        if (err.code === '42P01') {
            console.error('Table does not exist - Schema missing!');
        }
        process.exit(1);
    }
}

main();
