import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '@/lib/env';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy-initialize pool and db to avoid triggering env validation at build time.
// Next.js imports all route handler modules during build; if pool creation
// runs at import time it crashes because DATABASE_URL isn't set during build.
let _pool: Pool | undefined;
let _db: DbInstance | undefined;

function getPool() {
    if (!_pool) {
        _pool = new Pool({ connectionString: env.DATABASE_URL });
    }
    return _pool;
}

function getDb(): DbInstance {
    if (!_db) {
        _db = drizzle(getPool(), { schema });
    }
    return _db;
}

// Export a Proxy so existing code (`db.select(...)`) works unchanged.
export const db = new Proxy({} as DbInstance, {
    get(_target, prop) {
        return (getDb() as any)[prop];
    },
});

