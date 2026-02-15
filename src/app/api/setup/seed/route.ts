import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, studentProfiles, alumniProfiles } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        console.log('🌱 Seeding database via API...');

        // 1. Create Admin User
        const adminEmail = 'admin@vjit.ac.in';
        const adminPassword = await bcrypt.hash('admin123', 10);

        const existingAdmin = await db.query.users.findFirst({
            where: eq(users.email, adminEmail),
        });

        if (!existingAdmin) {
            await db.insert(users).values({
                email: adminEmail,
                passwordHash: adminPassword,
                name: 'System Administrator',
                role: 'admin',
                status: 'approved',
            });
            console.log('✅ Admin user created');
        }

        // 2. Create Demo Alumni
        const alumniEmail = 'alumni@example.com';
        const alumniPassword = await bcrypt.hash('password123', 10);

        const existingAlumni = await db.query.users.findFirst({
            where: eq(users.email, alumniEmail),
        });

        if (!existingAlumni) {
            const [newAlumni] = await db.insert(users).values({
                email: alumniEmail,
                passwordHash: alumniPassword,
                name: 'Rahul Verma',
                role: 'alumni',
                status: 'approved',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
            }).returning();

            await db.insert(alumniProfiles).values({
                userId: newAlumni.id,
                graduationYear: 2022,
                department: 'CSE',
                company: 'Google',
                designation: 'Software Engineer',
                linkedin: 'https://linkedin.com/in/rahulverma',
                bio: 'Passionate about distributed systems and cloud computing.',
            });
            console.log('✅ Demo Alumni created');
        }

        // 3. Create Demo Student
        const studentEmail = 'student@example.com';
        const studentPassword = await bcrypt.hash('password123', 10);

        const existingStudent = await db.query.users.findFirst({
            where: eq(users.email, studentEmail),
        });

        if (!existingStudent) {
            const [newStudent] = await db.insert(users).values({
                email: studentEmail,
                passwordHash: studentPassword,
                name: 'Sneha Reddy',
                role: 'student',
                status: 'approved',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
            }).returning();

            await db.insert(studentProfiles).values({
                userId: newStudent.id,
                rollNumber: '20JG1A0501',
                department: 'CSE',
                batch: 2024,
                skills: ['React', 'Node.js', 'Python'],
                interests: ['Web Development', 'AI/ML'],
            });
            console.log('✅ Demo Student created');
        }

        return NextResponse.json({ success: true, message: 'Seeding completed' });
    } catch (error: any) {
        console.error('❌ Seeding failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
