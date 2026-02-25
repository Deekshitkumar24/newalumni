import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, studentProfiles, alumniProfiles } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schema — backward-compatible input shape
// ---------------------------------------------------------------------------
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['student', 'alumni']),

    // Student specific
    rollNumber: z.string().optional(),
    department: z.string().optional(),
    graduationYear: z.coerce.number().optional(),
    skills: z.union([z.array(z.string()), z.string()]).optional(),
    interests: z.union([z.array(z.string()), z.string()]).optional(),

    // Alumni specific
    currentCompany: z.string().optional(),
    currentRole: z.string().optional(),
    linkedIn: z.string().optional(),
    careerJourney: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a value into a plain string[] suitable for jsonb storage. */
function toJsonbArray(val: string | string[] | null | undefined): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    // Might be a JSON-encoded string or comma-separated
    try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* not JSON */ }
    return val.split(',').map(s => s.trim()).filter(Boolean);
}

/** Wrap a JS array as a sql`...::jsonb` expression for node-postgres. */
function jsonbValue(arr: string[]) {
    return sql`${JSON.stringify(arr)}::jsonb`;
}

/** Map a node-postgres / PG error to a structured HTTP response. */
function pgErrorResponse(err: any, context: { email?: string; role?: string }) {
    const code: string | undefined = err?.code;
    const constraint: string | undefined = err?.constraint;

    // Safe logging — never log password / hash
    console.error('[Registration DB Error]', {
        pgCode: code,
        constraint,
        detail: err?.detail,
        message: err?.message,
        email: context.email,
        role: context.role,
    });

    // 23505 — unique_violation
    if (code === '23505') {
        // Roll number unique constraint
        if (constraint?.includes('roll_number')) {
            return NextResponse.json(
                { code: 'ROLL_NUMBER_EXISTS', error: 'This roll number is already registered.' },
                { status: 409 },
            );
        }
        // Email unique constraint
        const field = constraint?.includes('email') ? 'email' : 'unknown';
        return NextResponse.json(
            { code: 'USER_ALREADY_EXISTS', error: `A user with this ${field} already exists.`, field },
            { status: 409 },
        );
    }

    // 23503 — foreign_key_violation
    if (code === '23503') {
        return NextResponse.json(
            { code: 'FK_VIOLATION', error: 'Registration failed. Please try again.' },
            { status: 500 },
        );
    }

    // 42P01 — undefined_table (schema not applied)
    if (code === '42P01') {
        console.error('CRITICAL: Required table missing. Run "npx drizzle-kit push" to apply migrations.');
        return NextResponse.json(
            { code: 'CONFIG_ERROR', error: 'Server configuration error.' },
            { status: 500 },
        );
    }

    // Fallback
    return NextResponse.json(
        { code: 'INTERNAL_ERROR', error: 'Registration failed. Please try again.' },
        { status: 500 },
    );
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = registerSchema.parse(body);
        const { email, password, name, role } = data;

        // Check existing user (fast-path before hashing)
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existing) {
            return NextResponse.json(
                { code: 'USER_ALREADY_EXISTS', error: 'Email already exists', field: 'email' },
                { status: 409 },
            );
        }

        // Pre-check: duplicate roll number (student only, avoids DB exception)
        if (role === 'student' && data.rollNumber) {
            const existingRoll = await db.query.studentProfiles.findFirst({
                where: eq(studentProfiles.rollNumber, data.rollNumber),
                columns: { userId: true },
            });
            if (existingRoll) {
                return NextResponse.json(
                    { code: 'ROLL_NUMBER_EXISTS', error: 'This roll number is already registered.' },
                    { status: 409 },
                );
            }
        }

        const hashedPassword = await hashPassword(password);

        // Single transaction: user + profile
        const newUser = await db.transaction(async (tx) => {
            const [user] = await tx.insert(users).values({
                email,
                name,
                passwordHash: hashedPassword,
                role,
                status: 'pending',
            }).returning();

            if (role === 'student') {
                if (!data.rollNumber || !data.department || !data.graduationYear) {
                    throw new Error('Missing student details (Roll No, Dept, Year)');
                }

                const skillsArr = toJsonbArray(data.skills);
                const interestsArr = toJsonbArray(data.interests);

                // UPSERT — prevents duplicate-key crash on retry
                await tx.insert(studentProfiles).values({
                    userId: user.id,
                    rollNumber: data.rollNumber,
                    department: data.department,
                    batch: data.graduationYear,
                    skills: jsonbValue(skillsArr),
                    interests: jsonbValue(interestsArr),
                } as any).onConflictDoUpdate({
                    target: studentProfiles.userId,
                    set: {
                        rollNumber: data.rollNumber,
                        department: data.department,
                        batch: data.graduationYear,
                        skills: jsonbValue(skillsArr),
                        interests: jsonbValue(interestsArr),
                    } as any,
                });

            } else if (role === 'alumni') {
                if (!data.graduationYear || !data.department) {
                    throw new Error('Missing alumni details (Dept, Year)');
                }
                await tx.insert(alumniProfiles).values({
                    userId: user.id,
                    graduationYear: data.graduationYear,
                    department: data.department,
                    company: data.currentCompany,
                    designation: data.currentRole,
                    linkedin: data.linkedIn,
                    bio: data.careerJourney,
                });
            }

            return user;
        });

        // Same success response shape the frontend already expects
        return NextResponse.json({
            success: true,
            message: 'Registration successful. Account pending approval.',
            user: { id: newUser.id, email: newUser.email, role: newUser.role, status: newUser.status },
        });

    } catch (error: any) {
        // Zod validation errors → 400
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }

        // Missing-field errors thrown inside the transaction
        if (error?.message?.startsWith('Missing')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // PostgreSQL errors (have a numeric .code)
        if (error?.code && /^\d{5}$/.test(error.code)) {
            return pgErrorResponse(error, { email: undefined, role: undefined });
        }

        // Generic fallback — safe log
        console.error('[Registration Error]', {
            message: error?.message,
            stack: error?.stack,
        });
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 },
        );
    }
}
