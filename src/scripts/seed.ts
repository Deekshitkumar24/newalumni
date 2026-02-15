import { db } from '../db/index';
import { users, studentProfiles, alumniProfiles } from '../db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // 1. Create Admin User
        const adminEmail = 'admin@vjit.ac.in';
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const existingAdmin = await db.query.users.findFirst({
            where: (userTable: any, { eq }: any) => eq(userTable.email, adminEmail),
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
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // 2. Create Demo Alumni
        const alumniEmail = 'alumni@example.com';
        const alumniPassword = await bcrypt.hash('password123', 10);

        const existingAlumni = await db.query.users.findFirst({
            where: (userTable: any, { eq }: any) => eq(userTable.email, alumniEmail),
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
            where: (userTable: any, { eq }: any) => eq(userTable.email, studentEmail),
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

        console.log('🏁 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
