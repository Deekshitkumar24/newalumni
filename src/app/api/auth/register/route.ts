import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, studentProfiles, alumniProfiles } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Enhanced Schema to cover profile fields
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['student', 'alumni']),

    // Student specific
    rollNumber: z.string().optional(),
    department: z.string().optional(),
    graduationYear: z.any().optional(), // accept string or number, parse later
    skills: z.union([z.array(z.string()), z.string()]).optional(),
    interests: z.union([z.array(z.string()), z.string()]).optional(),

    // Alumni specific
    currentCompany: z.string().optional(),
    currentRole: z.string().optional(),
    linkedIn: z.string().optional(),
    careerJourney: z.string().optional(),
});

// Helper: ensure value is a proper array for jsonb storage
function toJsonbArray(val: string | string[] | undefined): string[] {
    if (!val) return [];
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val.split(',').map(s => s.trim()).filter(Boolean); }
    }
    return val;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = registerSchema.parse(body);
        const { email, password, name, role } = data;

        // Check existing
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        // Transaction to ensure User + Profile are created together
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
                await tx.insert(studentProfiles).values({
                    userId: user.id,
                    rollNumber: data.rollNumber,
                    department: data.department,
                    batch: Number(data.graduationYear),
                    skills: sql`${JSON.stringify(skillsArr)}::jsonb`,
                    interests: sql`${JSON.stringify(interestsArr)}::jsonb`,
                } as any);
            } else if (role === 'alumni') {
                if (!data.graduationYear || !data.department) {
                    throw new Error('Missing alumni details (Dept, Year)');
                }
                await tx.insert(alumniProfiles).values({
                    userId: user.id,
                    graduationYear: Number(data.graduationYear),
                    department: data.department,
                    company: data.currentCompany,
                    designation: data.currentRole,
                    linkedin: data.linkedIn,
                    bio: data.careerJourney
                });
            }

            return user;
        });

        // For pending users, we DO NOT log them in immediately.
        return NextResponse.json({
            success: true,
            message: 'Registration successful. Account pending approval.',
            user: { id: newUser.id, email: newUser.email, role: newUser.role, status: newUser.status }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error('Registration error:', error?.message, error?.stack);
        console.error('Registration error detail:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

