
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const details = Object.entries(fieldErrors)
            .map(([key, msgs]) => `  - ${key}: ${(msgs || []).join(', ')}`)
            .join('\n');
        const message = `❌ Invalid environment variables:\n${details}\n\nRequired env vars: DATABASE_URL, JWT_SECRET\nSet these in your .env file or Vercel project settings.`;
        console.error(message);
        throw new Error(message);
    }

    return parsed.data;
}

// Lazy validation via Proxy — only runs at runtime when a property is
// first accessed, NOT at import/build time.
let _env: z.infer<typeof envSchema> | undefined;
export const env = new Proxy({} as z.infer<typeof envSchema>, {
    get(_target, prop: string) {
        if (!_env) {
            _env = validateEnv();
        }
        return _env[prop as keyof typeof _env];
    },
});


