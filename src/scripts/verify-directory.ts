import 'dotenv/config';
import { db } from '../db';
import { users, studentProfiles, alumniProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyDirectory() {
    console.log('📂 Starting Directory & Profile Verification...\n');

    // authentication flow to get a token first
    let token = '';
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test.user.directory@example.com', // Needs to be created or exist
                password: 'password123'
            })
        });

        // If login fails, try register
        if (loginRes.status !== 200) {
            console.log('Login failed (' + loginRes.status + '), trying register...');
            const regRes = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test.user.directory@example.com',
                    password: 'password123',
                    name: 'Directory Tester',
                    role: 'student'
                })
            });
            if (regRes.status === 200) {
                const setCookie = regRes.headers.get('set-cookie');
                console.log('Register Set-Cookie:', setCookie);
                token = setCookie?.match(/token=([^;]+)/)?.[1] || '';
            } else {
                console.error('Register failed:', regRes.status, await regRes.text());
            }
        } else {
            console.log('Login successful');
            const setCookie = loginRes.headers.get('set-cookie');
            console.log('Login Set-Cookie:', setCookie);
            token = setCookie?.match(/token=([^;]+)/)?.[1] || '';
        }
    } catch (e) {
        console.error('Auth Setup Failed', e);
        return;
    }

    if (!token) {
        console.error('❌ Could not obtain auth token for tests');
        return;
    }
    console.log('✅ Auth Token Obtained');

    // Approve the user manually for search visibility
    await db.update(users)
        .set({ status: 'approved' })
        .where(eq(users.email, 'test.user.directory@example.com'));
    console.log('✅ User Approved for Directory Visibility');

    const dbUser = await db.query.users.findFirst({
        where: eq(users.email, 'test.user.directory@example.com'),
        with: { studentProfile: true }
    });
    console.log('🔍 DB Verify User:', {
        id: dbUser?.id,
        status: dbUser?.status,
        role: dbUser?.role,
        fullName: dbUser?.fullName,
        dept: dbUser?.studentProfile?.department
    });

    // 1. Test Profile Update (PATCH)
    console.log('\n1. Testing Profile Update...');
    try {
        const res = await fetch(`${BASE_URL}/profile/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`
            },
            body: JSON.stringify({
                fullName: 'Directory Tester Updated',
                department: 'CSE',
                batch: 2024,
                rollNumber: '24CSE101',
                interests: ['Coding', 'Testing']
            })
        });

        if (res.status === 200) {
            console.log('✅ Profile Update Successful');
        } else {
            console.error('❌ Profile Update Failed', res.status, await res.text());
        }
    } catch (e) {
        console.error('❌ Profile Patch Error', e);
    }

    // 2. Test Profile Get
    console.log('\n2. Testing Profile Get...');
    try {
        const res = await fetch(`${BASE_URL}/profile/me`, {
            headers: { 'Cookie': `token=${token}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.user.fullName === 'Directory Tester Updated') {
            console.log('✅ Profile Fetched & Verified');
        } else {
            console.error('❌ Profile Get Failed or Mismatch', data);
        }
    } catch (e) {
        console.error('❌ Profile Get Error', e);
    }

    // 3. Test Directory Search
    console.log('\n3. Testing Directory Search...');
    try {
        // Search by name
        const searchRes = await fetch(`${BASE_URL}/directory?query=Tester&role=student`, {
            headers: { 'Cookie': `token=${token}` }
        });
        const searchData = await searchRes.json();

        if (searchRes.status === 200 && searchData.data.length > 0) {
            console.log(`✅ Directory Search: Found ${searchData.data.length} results for 'Tester'`);
        } else {
            console.warn('⚠️ Directory Search: No results found (might need index refresh or wait)', searchData);
        }

        // Filter by Department
        const filterRes = await fetch(`${BASE_URL}/directory?department=CSE&role=student`, {
            headers: { 'Cookie': `token=${token}` }
        });
        const filterData = await filterRes.json();
        if (filterRes.status === 200 && filterData.data.length > 0) {
            console.log(`✅ Directory Filter: Found ${filterData.data.length} results for Dept 'CSE'`);
        } else {
            console.warn('⚠️ Directory Filter: No results found', filterData);
        }

    } catch (e) {
        console.error('❌ Directory Search Error', e);
    }
}

verifyDirectory();
