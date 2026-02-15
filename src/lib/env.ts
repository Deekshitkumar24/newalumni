
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables. Check server logs.');
    }

    return parsed.data;
}

export const env = validateEnv();
