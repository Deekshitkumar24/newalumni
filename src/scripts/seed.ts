
import { db } from '../db';
import { users, studentProfiles, alumniProfiles } from '../db/schema';
import { hashPassword } from '../lib/auth/password';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { exit } from 'process';

// Load environment variables
dotenv.config();

// Default values if env vars are not set
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@vjit.ac.in';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'VJIT Admin';

const ALUMNI_EMAIL = process.env.SEED_ALUMNI_EMAIL || 'alumni@vjit.ac.in';
const ALUMNI_PASSWORD = process.env.SEED_ALUMNI_PASSWORD || 'alumni123';

const STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL || 'student@vjit.ac.in';
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'student123';

async function seed() {
    console.log('🌱 Starting database seed...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing. Cannot seed.');
        exit(1);
    }

    try {
        // 1. Create Admin
        const existingAdmin = await db.query.users.findFirst({
            where: eq(users.email, ADMIN_EMAIL)
        });

        if (!existingAdmin) {
            console.log(`Creating Admin: ${ADMIN_EMAIL}`);
            const hashedPassword = await hashPassword(ADMIN_PASSWORD);
            await db.insert(users).values({
                email: ADMIN_EMAIL,
                passwordHash: hashedPassword,
                name: ADMIN_NAME,
                role: 'admin',
                status: 'approved'
            });
            console.log('✅ Admin created successfully.');
        } else {
            console.log('ℹ️ Admin already exists. Skipping.');
        }

        // 2. Create Alumni (Optional)
        const existingAlumni = await db.query.users.findFirst({
            where: eq(users.email, ALUMNI_EMAIL)
        });

        if (!existingAlumni) {
            console.log(`Creating Alumni: ${ALUMNI_EMAIL}`);
            const hashedPassword = await hashPassword(ALUMNI_PASSWORD);

            await db.transaction(async (tx) => {
                const [user] = await tx.insert(users).values({
                    email: ALUMNI_EMAIL,
                    passwordHash: hashedPassword,
                    name: 'Demo Alumni',
                    role: 'alumni',
                    status: 'approved'
                }).returning();

                await tx.insert(alumniProfiles).values({
                    userId: user.id,
                    graduationYear: 2020,
                    department: 'CSE',
                    company: 'Google',
                    designation: 'Software Engineer',
                    linkedin: 'https://linkedin.com/in/demo-alumni',
                    bio: 'Passionate about technology.'
                });
            });
            console.log('✅ Alumni created successfully.');
        } else {
            console.log('ℹ️ Alumni already exists. Skipping.');
        }

        // 3. Create Student (Optional)
        const existingStudent = await db.query.users.findFirst({
            where: eq(users.email, STUDENT_EMAIL)
        });

        if (!existingStudent) {
            console.log(`Creating Student: ${STUDENT_EMAIL}`);
            const hashedPassword = await hashPassword(STUDENT_PASSWORD);

            await db.transaction(async (tx) => {
                const [user] = await tx.insert(users).values({
                    email: STUDENT_EMAIL,
                    passwordHash: hashedPassword,
                    name: 'Demo Student',
                    role: 'student',
                    status: 'approved'
                }).returning();

                await tx.insert(studentProfiles).values({
                    userId: user.id,
                    rollNumber: '20-CSE-101',
                    department: 'CSE',
                    batch: 2024,
                    skills: ['React', 'Node.js'],
                    interests: ['Web Development']
                });
            });
            console.log('✅ Student created successfully.');
        } else {
            console.log('ℹ️ Student already exists. Skipping.');
        }

        console.log('🎉 Seeding completed!');
        exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        exit(1);
    }
}

seed();
