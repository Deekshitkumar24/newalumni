import 'dotenv/config';
import { db } from '../db';
import { users, reports } from '../db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyPhase5() {
    console.log('🛡️ Starting Phase 5 Verification...\n');

    // Setup: Get admin token
    let adminToken = '';
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@vjit.ac.in', password: 'admin123' })
    });
    if (adminLoginRes.status === 200) {
        adminToken = adminLoginRes.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
        console.log('✅ Admin Login OK');
    } else {
        console.error('❌ Admin Login Failed', adminLoginRes.status);
        return;
    }

    // 1. List Users (Admin)
    console.log('\n1. GET /api/admin/users...');
    const usersRes = await fetch(`${BASE_URL}/admin/users?page=1&limit=5`, {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    const usersData = await usersRes.json();
    if (usersRes.status === 200 && usersData.data) {
        console.log(`✅ Users Listed: ${usersData.data.length} users, total=${usersData.pagination.total}`);
        // Verify no passwordHash
        const hasPasswordHash = usersData.data.some((u: any) => u.passwordHash !== undefined);
        console.log(`✅ passwordHash excluded: ${!hasPasswordHash}`);
    } else {
        console.error('❌ List Users Failed', usersData);
    }

    // 2. Filter Users by Role
    console.log('\n2. GET /api/admin/users?role=student...');
    const filteredRes = await fetch(`${BASE_URL}/admin/users?role=student`, {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    const filteredData = await filteredRes.json();
    if (filteredRes.status === 200) {
        const allStudents = filteredData.data.every((u: any) => u.role === 'student');
        console.log(`✅ Role Filter: ${allStudents ? 'Correct' : 'WRONG'} (${filteredData.data.length} students)`);
    }

    // 3. Status Transition Tests
    console.log('\n3. Status Transition Tests...');
    // Find a pending user
    const pendingRes = await fetch(`${BASE_URL}/admin/users?status=pending&limit=1`, {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    const pendingData = await pendingRes.json();

    if (pendingData.data?.length > 0) {
        const targetId = pendingData.data[0].id;

        // PENDING → APPROVED (valid)
        const approveRes = await fetch(`${BASE_URL}/admin/users/${targetId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
            body: JSON.stringify({ status: 'approved' })
        });
        console.log(`  PENDING→APPROVED: ${approveRes.status === 200 ? '✅' : '❌'} (${approveRes.status})`);

        // APPROVED → SUSPENDED (valid)
        const suspendRes = await fetch(`${BASE_URL}/admin/users/${targetId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
            body: JSON.stringify({ status: 'suspended' })
        });
        console.log(`  APPROVED→SUSPENDED: ${suspendRes.status === 200 ? '✅' : '❌'} (${suspendRes.status})`);

        // SUSPENDED → REJECTED (invalid)
        const invalidRes = await fetch(`${BASE_URL}/admin/users/${targetId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
            body: JSON.stringify({ status: 'rejected' })
        });
        console.log(`  SUSPENDED→REJECTED (blocked): ${invalidRes.status === 400 ? '✅' : '❌'} (${invalidRes.status})`);

        // SUSPENDED → APPROVED (valid, restore)
        const restoreRes = await fetch(`${BASE_URL}/admin/users/${targetId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
            body: JSON.stringify({ status: 'approved' })
        });
        console.log(`  SUSPENDED→APPROVED: ${restoreRes.status === 200 ? '✅' : '❌'} (${restoreRes.status})`);
    } else {
        console.log('  ⚠️ No pending users to test transitions');
    }

    // 4. Self-modification block
    console.log('\n4. Self-Modification Block...');
    // Get admin ID from any user list
    const adminUser = usersData.data.find((u: any) => u.email === 'admin@vjit.ac.in');
    if (adminUser) {
        const selfRes = await fetch(`${BASE_URL}/admin/users/${adminUser.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
            body: JSON.stringify({ status: 'suspended' })
        });
        console.log(`  Self-modify blocked: ${selfRes.status === 400 ? '✅' : '❌'} (${selfRes.status})`);
    }

    // 5. Report System
    console.log('\n5. Report System...');
    // Login as student to create a report
    let studentToken = '';
    const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student.chat@example.com', password: 'password123' })
    });
    if (studentLogin.status === 200) {
        studentToken = studentLogin.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1] || '';
    }

    // Student reports alumni
    const alumniUser = usersData.data.find((u: any) => u.role === 'alumni');
    if (studentToken && alumniUser) {
        const reportRes = await fetch(`${BASE_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': `token=${studentToken}` },
            body: JSON.stringify({ reportedId: alumniUser.id, reason: 'Test report for verification purposes - inappropriate content' })
        });
        const reportData = await reportRes.json();
        console.log(`  Create Report: ${reportRes.status === 201 ? '✅' : '❌'} (${reportRes.status})`);

        // Admin lists reports
        const listReportsRes = await fetch(`${BASE_URL}/admin/reports`, {
            headers: { 'Cookie': `token=${adminToken}` }
        });
        const reportsData = await listReportsRes.json();
        console.log(`  List Reports: ${listReportsRes.status === 200 ? '✅' : '❌'} (${reportsData.data?.length} reports)`);

        // Admin resolves report
        if (reportData.data?.id) {
            const resolveRes = await fetch(`${BASE_URL}/admin/reports/${reportData.data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
                body: JSON.stringify({ status: 'resolved' })
            });
            console.log(`  Resolve Report: ${resolveRes.status === 200 ? '✅' : '❌'} (${resolveRes.status})`);
        }
    } else {
        console.log('  ⚠️ Missing test users for report test');
    }

    // 6. Non-admin access blocked
    console.log('\n6. RBAC Check...');
    if (studentToken) {
        const blockedRes = await fetch(`${BASE_URL}/admin/users`, {
            headers: { 'Cookie': `token=${studentToken}` }
        });
        console.log(`  Student→Admin API blocked: ${blockedRes.status === 403 ? '✅' : '❌'} (${blockedRes.status})`);
    }

    console.log('\n🏁 Phase 5 Verification Complete!');
}

verifyPhase5();
