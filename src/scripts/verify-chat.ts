import 'dotenv/config';
import { db } from '../db';
import { users, conversations, mentorshipRequests } from '../db/schema';
import { eq } from 'drizzle-orm';
// import Pusher from 'pusher-js'; // Client side, tricky in Node script without polyfills. 
// We will verify API side effects (DB, Logs) instead of real-time socket connection for simplicity,
// or use a basic rest check.

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyChat() {
    console.log('💬 Starting Chat System Verification...\n');

    const alumniEmail = 'alumni.chat@example.com';
    const studentEmail = 'student.chat@example.com';
    let alumniToken = '';
    let studentToken = '';
    let alumniId = '';
    let studentId = '';

    // 1. Setup Users & Mentorship
    console.log('1. Setting up Users & Mentorship...');

    // Setup Alumni
    let resAlumni = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alumniEmail, password: 'password123', name: 'Alumni Chatter', role: 'alumni' })
    });
    if (resAlumni.status !== 200) resAlumni = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alumniEmail, password: 'password123' })
    });
    if (resAlumni.status === 200) {
        alumniToken = resAlumni.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, alumniEmail));
        const u = await db.query.users.findFirst({ where: eq(users.email, alumniEmail) });
        alumniId = u?.id || '';
    }

    // Setup Student
    let resStudent = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password123', name: 'Student Chatter', role: 'student' })
    });
    if (resStudent.status !== 200) resStudent = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password123' })
    });
    if (resStudent.status === 200) {
        studentToken = resStudent.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, studentEmail));
        const u = await db.query.users.findFirst({ where: eq(users.email, studentEmail) });
        studentId = u?.id || '';
    }

    // Force Create Accepted Mentorship (Bypassing API flow for speed, or use API if strict)
    // Using DB direction for speed setup
    await db.insert(mentorshipRequests).values({
        studentId,
        alumniId,
        status: 'accepted',
        message: 'Pre-existing mentorship for chat test'
    }).onConflictDoNothing();

    console.log('✅ Users & Mentorship Ready');

    // 2. Create Conversation
    console.log('\n2. Creating Conversation...');
    let conversationId = '';
    try {
        const createRes = await fetch(`${BASE_URL}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${studentToken}`
            },
            body: JSON.stringify({
                type: 'direct',
                participantId: alumniId
            })
        });
        const createData = await createRes.json();

        if (createRes.status === 201 || createRes.status === 200) {
            console.log('✅ Conversation Created/Retrieved');
            conversationId = createData.data.id;
        } else {
            console.error('❌ Create Conversation Failed', createRes.status, createData);
            return;
        }
    } catch (e) {
        console.error('❌ Create Error', e);
    }

    // 3. Duplicate Conversation Check
    console.log('\n3. Checking Duplicate Conversation...');
    const dupRes = await fetch(`${BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${studentToken}`
        },
        body: JSON.stringify({
            type: 'direct',
            participantId: alumniId
        })
    });
    const dupData = await dupRes.json();
    if (dupData.data.id === conversationId) {
        console.log('✅ Duplicate Check Passed (Returned Existing ID)');
    } else {
        console.error('❌ Duplicate Check Failed', dupData);
    }

    // 4. Send Message & Verify Transaction
    console.log('\n4. Sending Message...');
    if (conversationId) {
        const msgRes = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${studentToken}`
            },
            body: JSON.stringify({ content: 'Hello Mentor!' })
        });
        const msgData = await msgRes.json();

        if (msgRes.status === 201) {
            console.log('✅ Message Sent');

            // Verify Conversation lastMessageAt updated
            const conv = await db.query.conversations.findFirst({
                where: eq(conversations.id, conversationId)
            });
            // Roughly check time (within last minute)
            if (conv && new Date().getTime() - new Date(conv.lastMessageAt).getTime() < 60000) {
                console.log('✅ Conversation lastMessageAt Updated');
            } else {
                console.error('❌ lastMessageAt NOT updated');
            }

        } else {
            console.error('❌ Send Message Failed', msgRes.status, msgData);
        }
    }

    // 5. List Messages (Alumni View)
    console.log('\n5. Listing Messages (Alumni)...');
    if (conversationId) {
        const listRes = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
            headers: { 'Cookie': `token=${alumniToken}` }
        });
        const listData = await listRes.json();

        if (listRes.status === 200 && listData.data.length > 0) {
            console.log(`✅ Messages Retrieved: ${listData.data.length} messages`);
            console.log(`   Content: "${listData.data[0].content}"`);
        } else {
            console.error('❌ List Messages Failed', listData);
        }
    }

    // 6. Test Pusher Auth
    console.log('\n6. Testing Pusher Auth...');
    if (conversationId) {
        const authRes = await fetch(`${BASE_URL}/pusher/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `token=${alumniToken}`
            },
            body: `socket_id=123.456&channel_name=private-conversation-${conversationId}`
        });

        if (authRes.status === 200) {
            console.log('✅ Pusher Auth Successful');
        } else {
            // 403 or 500 might happen if real pusher config is invalid, but structure should be correct
            // If Status 200, it means signed JSON returned.
            console.error('❌ Pusher Auth Failed', authRes.status);
        }
    }
}

verifyChat();
