
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Manual env loader
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
                    if (key && value && !key.startsWith('#')) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to load .env', e);
    }
}

async function runMigration() {
    const { db } = await import('@/db');
    console.log('Running Manual Migration...');

    try {
        // 1. Create Enum
        try {
            await db.execute(sql`CREATE TYPE "moderation_status" AS ENUM ('pending', 'approved', 'rejected')`);
            console.log('Enum moderation_status created.');
        } catch (e: any) {
            if (e.code === '42710') { // duplicate_object
                console.log('Enum moderation_status already exists.');
            } else {
                throw e;
            }
        }

        // 2. Add Column to jobs table
        try {
            await db.execute(sql`ALTER TABLE "jobs" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL`);
            console.log('Column moderation_status added to jobs.');
        } catch (e: any) {
            if (e.code === '42701') { // duplicate_column
                console.log('Column moderation_status already exists in jobs.');
            } else {
                throw e;
            }
        }

        // 3. Create slider_images table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "slider_images" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "image_url" varchar NOT NULL,
                "title" varchar,
                "display_order" integer DEFAULT 0 NOT NULL,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            )
        `);
        console.log('Table slider_images created/verified.');

        // 4. Create gallery_images table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "gallery_images" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "image_url" varchar NOT NULL,
                "title" varchar,
                "category" varchar,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            )
        `);
        console.log('Table gallery_images created/verified.');

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }

    console.log('Migration Completed Successfully.');
    process.exit(0);
}

runMigration();
