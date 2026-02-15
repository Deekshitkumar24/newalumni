import 'dotenv/config';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyJobs() {
    console.log('💼 Starting Job API Verification...\n');

    // 1. Setup Alumni User (Job Poster)
    const alumniEmail = 'alumni.poster@example.com';
    let alumniToken = '';

    // Register/Login Alumni
    console.log('1. Setting up Alumni User...');
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: alumniEmail,
            password: 'password123',
            name: 'Alumni Poster',
            role: 'alumni'
        })
    });

    if (res.status !== 200) {
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: alumniEmail, password: 'password123' })
        });
    }

    if (res.status === 200) {
        alumniToken = res.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        console.log('✅ Alumni Token Obtained');

        // Approve Alumni
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, alumniEmail));
        console.log('✅ Alumni Approved');
    } else {
        console.error('❌ Alumni Setup Failed', res.status);
        return;
    }

    // 2. Post a Job
    console.log('\n2. Posting a Job...');
    let jobId = '';
    try {
        const postRes = await fetch(`${BASE_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${alumniToken}`
            },
            body: JSON.stringify({
                title: 'Senior React Developer',
                company: 'TechCorp',
                location: 'Remote',
                description: 'We are looking for a Senior React Developer...',
                type: 'full_time'
            })
        });

        const postData = await postRes.json();
        if (postRes.status === 201) {
            console.log('✅ Job Posted Successfully');
            jobId = postData.data.id;
        } else {
            console.error('❌ Job Post Failed', postRes.status, postData);
        }
    } catch (e) {
        console.error('❌ Job Post Error', e);
    }

    // 3. List Jobs
    console.log('\n3. Listing Jobs...');
    try {
        const listRes = await fetch(`${BASE_URL}/jobs?limit=5`, {
            headers: { 'Cookie': `token=${alumniToken}` }
        });
        const listData = await listRes.json();

        if (listRes.status === 200 && listData.data.length > 0) {
            console.log(`✅ Jobs Listed: Found ${listData.data.length} jobs`);
            const job = listData.data[0];
            if (job.poster && job.poster.fullName) {
                console.log('✅ Poster Info Included:', job.poster.fullName);
            } else {
                console.error('❌ Poster Info Missing');
            }
        } else {
            console.warn('⚠️ No Jobs Found (or Error)', listData);
        }
    } catch (e) {
        console.error('❌ Job List Error', e);
    }

    // 4. Get Job Detail
    if (jobId) {
        console.log(`\n4. Getting Job Detail (${jobId})...`);
        try {
            const detailRes = await fetch(`${BASE_URL}/jobs/${jobId}`, {
                headers: { 'Cookie': `token=${alumniToken}` }
            });
            const detailData = await detailRes.json();

            if (detailRes.status === 200) {
                console.log('✅ Job Detail Fetched');
                if (detailData.data.id === jobId) {
                    console.log('✅ Job ID Matches');
                }
            } else {
                console.error('❌ Job Detail Failed', detailRes.status, detailData);
            }
        } catch (e) {
            console.error('❌ Job Detail Error', e);
        }
    }

    // 5. Application Flow
    console.log('\n5. Testing Application Flow...');
    const studentEmail = 'student.applicant@example.com';
    let studentToken = '';

    // A. Setup Student
    let resStudent = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: studentEmail,
            password: 'password123',
            name: 'Student Applicant',
            role: 'student'
        })
    });

    if (resStudent.status !== 200) {
        resStudent = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentEmail, password: 'password123' })
        });
    }

    if (resStudent.status === 200) {
        studentToken = resStudent.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        console.log('✅ Student Token Obtained');
        await db.update(users).set({ status: 'approved' }).where(eq(users.email, studentEmail));
    } else {
        console.error('❌ Student Setup Failed');
        return;
    }

    // B. Apply to Job
    if (jobId) {
        try {
            console.log(`Applying to Job ID: ${jobId}`);
            const applyRes = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Cookie': `token=${studentToken}` }
            });
            const applyData = await applyRes.json();
            let appId = '';

            if (applyRes.status === 201) {
                console.log('✅ Application Submitted');
                appId = applyData.data.id;
            } else {
                console.error('❌ Application Failed', applyRes.status, applyData);
            }

            // C. Duplicate Check
            const dupRes = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Cookie': `token=${studentToken}` }
            });
            if (dupRes.status === 409) {
                console.log('✅ Duplicate Application Blocked');
            } else {
                console.error('❌ Duplicate Application Check Failed', dupRes.status);
            }

            // D. Status Update (by Alumni)
            if (appId) {
                console.log(`Updating Application ID: ${appId}`);
                const patchRes = await fetch(`${BASE_URL}/applications/${appId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `token=${alumniToken}`
                    },
                    body: JSON.stringify({ status: 'shortlisted' })
                });
                const patchData = await patchRes.json();

                if (patchRes.status === 200 && patchData.status === 'shortlisted') {
                    console.log('✅ Application Status Updated to Shortlisted');
                } else {
                    console.error('❌ Status Update Failed', patchRes.status, patchData);
                }
            }

        } catch (e) {
            console.error('❌ Application Flow Error', e);
        }
    }
}

verifyJobs();
