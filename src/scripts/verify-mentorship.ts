import 'dotenv/config';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyMentorship() {
    console.log('🤝 Starting Mentorship & Notification Verification...\n');

    const alumniEmail = 'alumni.mentor@example.com';
    const studentEmail = 'student.mentee@example.com';
    let alumniToken = '';
    let studentToken = '';
    let alumniId = '';

    // 1. Setup Users
    console.log('1. Setting up Users...');

    // Setup Alumni
    let resAlumni = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alumniEmail, password: 'password123', name: 'Alumni Mentor', role: 'alumni' })
    });
    if (resAlumni.status !== 200) resAlumni = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alumniEmail, password: 'password123' })
    });
    if (resAlumni.status === 200) {
        alumniToken = resAlumni.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        console.log('✅ Alumni Token Obtained');
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, alumniEmail));
        const alumniUser = await db.query.users.findFirst({ where: eq(users.email, alumniEmail) });
        alumniId = alumniUser?.id || '';
    }

    // Setup Student
    let resStudent = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password123', name: 'Student Mentee', role: 'student' })
    });
    if (resStudent.status !== 200) resStudent = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password123' })
    });
    if (resStudent.status === 200) {
        studentToken = resStudent.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        console.log('✅ Student Token Obtained');
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, studentEmail));
    }

    if (!alumniToken || !studentToken || !alumniId) {
        console.error('❌ User Setup Failed');
        return;
    }

    // 2. Send Mentorship Request
    console.log('\n2. Sending Mentorship Request...');
    let requestId = '';
    try {
        const reqRes = await fetch(`${BASE_URL}/mentorship/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${studentToken}`
            },
            body: JSON.stringify({
                alumniId: alumniId,
                message: 'I would like your guidance on career path.'
            })
        });
        const reqData = await reqRes.json();

        if (reqRes.status === 201) {
            console.log('✅ Mentorship Request Sent');
            requestId = reqData.data.id;
        } else {
            console.error('❌ Request Failed', reqRes.status, reqData);
        }
    } catch (e) {
        console.error('❌ Request Error', e);
    }

    // 3. Duplicate Check
    console.log('\n3. Checking Duplicate Request...');
    const dupRes = await fetch(`${BASE_URL}/mentorship/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${studentToken}`
        },
        body: JSON.stringify({
            alumniId: alumniId,
            message: 'Duplicate request.'
        })
    });
    if (dupRes.status === 409) {
        console.log('✅ Duplicate Request Blocked');
    } else {
        console.error('❌ Duplicate Check Failed', dupRes.status);
    }

    // 4. Verify Notification (Alumni)
    console.log('\n4. Checking Alumni Notifications...');
    let notifId = '';
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Cookie': `token=${alumniToken}` }
    });
    const notifData = await notifRes.json();
    if (notifRes.status === 200 && notifData.data.length > 0) {
        console.log(`✅ Alumni has ${notifData.data.length} notifications`);
        if (notifData.data[0].type === 'mentorship_request') {
            console.log('✅ Notification Type Correct');
            notifId = notifData.data[0].id;
        }
    } else {
        console.error('❌ Notifications Missing', notifData);
    }

    // 5. Accept Request
    if (requestId) {
        console.log('\n5. Accepting Request...');
        const acceptRes = await fetch(`${BASE_URL}/mentorship/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${alumniToken}`
            },
            body: JSON.stringify({ status: 'accepted' })
        });

        if (acceptRes.status === 200) {
            console.log('✅ Request Accepted');
        } else {
            console.error('❌ Accept Failed', acceptRes.status);
        }
    }

    // 6. Verify Notification (Student)
    console.log('\n6. Checking Student Notifications...');
    const studNotifRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Cookie': `token=${studentToken}` }
    });
    const studNotifData = await studNotifRes.json();
    if (studNotifRes.status === 200 && studNotifData.data.length > 0) {
        if (studNotifData.data[0].type === 'mentorship_accepted') {
            console.log('✅ Student Received Acceptance Notification');
        } else {
            console.error('❌ Incorrect Notification Type', studNotifData.data[0].type);
        }
    } else {
        console.error('❌ Student Notification Missing');
    }

    // 7. Mark Read
    if (notifId) {
        console.log('\n7. Marking Notification as Read...');
        const readRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
            method: 'PATCH',
            headers: { 'Cookie': `token=${alumniToken}` }
        });
        if (readRes.status === 200) {
            console.log('✅ Notification Marked Read');
        } else {
            console.error('❌ Mark Read Failed');
        }
    }
}

verifyMentorship();
