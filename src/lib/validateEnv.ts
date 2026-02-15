/**
 * Validate required environment variables at application boot.
 * Import this from instrumentation.ts or layout.tsx to fail fast.
 */
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
];

const OPTIONAL_ENV_VARS = [
    'PUSHER_APP_ID',
    'NEXT_PUBLIC_PUSHER_KEY',
    'PUSHER_SECRET',
    'NEXT_PUBLIC_PUSHER_CLUSTER',
];

export function validateEnv() {
    const missing: string[] = [];

    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `❌ Missing required environment variables:\n  ${missing.join('\n  ')}\n\nPlease set these in your .env file.`
        );
    }

    // Warn about optional vars
    const missingOptional: string[] = [];
    for (const envVar of OPTIONAL_ENV_VARS) {
        if (!process.env[envVar]) {
            missingOptional.push(envVar);
        }
    }
    if (missingOptional.length > 0) {
        console.warn(`⚠️ Optional env vars not set (features disabled): ${missingOptional.join(', ')}`);
    }
}
