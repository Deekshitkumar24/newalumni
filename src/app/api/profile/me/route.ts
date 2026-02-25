import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, studentProfiles, alumniProfiles } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

// Zod Schemas
const studentUpdateSchema = z.object({
    rollNumber: z.string().optional(),
    department: z.string().optional(),
    batch: z.coerce.number().optional(), // Coerce form data strings to numbers
    skills: z.union([z.array(z.string()), z.string()]).optional(),
    interests: z.union([z.array(z.string()), z.string()]).optional(),
    fullName: z.string().min(2).optional(), // Allow updating full name
    profileImage: z.string().url().optional(),
});

const alumniUpdateSchema = z.object({
    graduationYear: z.coerce.number().optional(),
    department: z.string().optional(),
    company: z.string().optional(),
    designation: z.string().optional(),
    linkedin: z.string().url().optional(),
    bio: z.string().optional(),
    fullName: z.string().min(2).optional(),
    profileImage: z.string().url().optional(),
});

import { cookies } from 'next/headers';

// Helper to get authenticated user
async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    // Verify Token
    const payload = verifyToken(token);

    if (!payload?.id) return null;
    return payload;
}

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch User + Profile
        // We use query builder's 'with' relational query if possible, or manual left join
        // Drizzle relational queries are robust.

        const user = await db.query.users.findFirst({
            where: (users, { eq, and, isNull }) => and(
                eq(users.id, auth.id),
                isNull(users.deletedAt)
            ),
            with: {
                studentProfile: true, // Only returns if match
                alumniProfile: true,
            },
            columns: {
                passwordHash: false, // Exclude sensitive
                deletedAt: false,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.status === 'suspended') {
            return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }

        // Structure response
        const profile = user.role === 'student' ? user.studentProfile : user.alumniProfile;

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                fullName: user.fullName || user.name, // Fallback
                role: user.role,
                status: user.status,
                profileImage: user.profileImage,
                canCreateEvents: user.canCreateEvents,
                settings: user.settings, // Return settings
                createdAt: user.createdAt,
            },
            profile: profile || null, // Might be null if not yet created
        });

    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // Check Access & Role
        const user = await db.query.users.findFirst({
            where: (users, { eq, and, isNull }) => and(
                eq(users.id, auth.id),
                isNull(users.deletedAt)
            ),
        });

        if (!user || user.status === 'suspended') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Role-based Update
        if (user.role === 'student') {
            const data = studentUpdateSchema.parse(body);

            // 1. Update Core User fields if present
            if (data.fullName || data.profileImage || (body as any).settings) {
                await db.update(users)
                    .set({
                        fullName: data.fullName,
                        profileImage: data.profileImage,
                        settings: (body as any).settings, // Save settings JSON
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, user.id));
            }

            // 2. Upsert Profile
            // Clean profile data (remove user fields)
            const { fullName, profileImage, ...profileData } = data;

            if (Object.keys(profileData).length > 0) {
                // Ensure skills/interests are properly cast to jsonb
                const insertValues: any = { userId: user.id, ...profileData };
                const updateSet: any = { ...profileData };
                if (profileData.skills) {
                    const skillsJson = JSON.stringify(Array.isArray(profileData.skills) ? profileData.skills : []);
                    insertValues.skills = sql`${skillsJson}::jsonb`;
                    updateSet.skills = sql`${skillsJson}::jsonb`;
                }
                if (profileData.interests) {
                    const interestsJson = JSON.stringify(Array.isArray(profileData.interests) ? profileData.interests : []);
                    insertValues.interests = sql`${interestsJson}::jsonb`;
                    updateSet.interests = sql`${interestsJson}::jsonb`;
                }
                await db.insert(studentProfiles)
                    .values(insertValues as typeof studentProfiles.$inferInsert)
                    .onConflictDoUpdate({
                        target: studentProfiles.userId,
                        set: updateSet,
                    });
            }

        } else if (user.role === 'alumni') {
            const data = alumniUpdateSchema.parse(body);

            // 1. Update Core User fields if present
            if (data.fullName || data.profileImage || (body as any).settings) {
                await db.update(users)
                    .set({
                        fullName: data.fullName,
                        profileImage: data.profileImage,
                        settings: (body as any).settings, // Save settings JSON
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, user.id));
            }

            // 2. Upsert Profile
            const { fullName, profileImage, ...profileData } = data;

            if (Object.keys(profileData).length > 0) {
                await db.insert(alumniProfiles)
                    .values({ userId: user.id, ...profileData } as typeof alumniProfiles.$inferInsert)
                    .onConflictDoUpdate({
                        target: alumniProfiles.userId,
                        set: profileData,
                    });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        console.error('Profile PATCH error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
