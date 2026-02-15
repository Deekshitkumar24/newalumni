import { users } from '../db/schema'; // Ensure this path is correct relative to script execution
// We can't import db directly if we want to run this as a standalone script easily without ts-node/paths issues unless we use tsx and paths are set up.
// Let's use fetch to hit the running server.

const BASE_URL = 'http://192.168.31.147:3000/api';

async function verifyAuth() {
    console.log('🔒 Starting Authentication System Verification...\n');

    let accessToken = '';
    let refreshToken = '';
    const testEmail = `test.user.${Date.now()}@example.com`;
    const testPassword = 'password123';

    // Helper to parse cookies
    const getCookie = (res: Response, name: string) => {
        const setCookie = res.headers.get('set-cookie');
        if (!setCookie) return null;
        const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
        return match ? match[1] : null;
    };

    // 1. Test Registration
    console.log('1. Testing Registration...');
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                name: 'Test User',
                role: 'student'
            })
        });

        if (res.status === 200) {
            console.log('✅ Registration Successful (200 OK)');
            const token = getCookie(res, 'token');
            const refresh = getCookie(res, 'refreshToken');

            if (token && refresh) {
                console.log('✅ Registration Cookies Set (token & refreshToken)');
            } else {
                console.error('❌ Registration Cookies Missing!', { token, refresh });
            }
        } else {
            console.error('❌ Registration Failed:', res.status, await res.text());
        }
    } catch (e) {
        console.error('❌ Registration Error:', e);
    }

    // 2. Test Login
    console.log('\n2. Testing Login...');
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        if (res.status === 200) {
            console.log('✅ Login Successful (200 OK)');
            const token = getCookie(res, 'token');
            const refresh = getCookie(res, 'refreshToken');

            if (token && refresh) {
                console.log('✅ Login Cookies Set (token & refreshToken)');
                accessToken = token;
                refreshToken = refresh;
            } else {
                console.error('❌ Login Cookies Missing!', { token, refresh });
            }
        } else {
            console.error('❌ Login Failed:', res.status, await res.text());
        }
    } catch (e) {
        console.error('❌ Login Error:', e);
    }

    // 3. Test Refresh Token
    console.log('\n3. Testing Refresh Token...');
    if (refreshToken) {
        try {
            const res = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Cookie': `refreshToken=${refreshToken}`
                }
            });

            if (res.status === 200) {
                console.log('✅ Refresh Successful (200 OK)');
                const newToken = getCookie(res, 'token');
                if (newToken && newToken !== accessToken) {
                    console.log('✅ New Access Token Issued');
                    accessToken = newToken; // Update for next steps
                } else if (newToken) {
                    console.warn('⚠️ Access Token Same as Before (Might be intended based on implementation)');
                } else {
                    console.error('❌ New Access Token Missing in Cookie');
                }
            } else {
                console.error('❌ Refresh Failed:', res.status, await res.text());
            }
        } catch (e) {
            console.error('❌ Refresh Error:', e);
        }
    } else {
        console.log('⚠️ Skipping Refresh Test (No refresh token available)');
    }

    // 4. Test Protected Route (Admin Dashboard - Should Fail for Student)
    // Note: Middleware redirects, so we check for status 307 or 200 if we follow redirect
    // But fetch follows redirects by default. Let's set redirect: 'manual'
    console.log('\n4. Testing RBAC (Student accessing Admin Route)...');
    try {
        const res = await fetch(`http://192.168.31.147:3000/dashboard/admin`, {
            method: 'GET',
            headers: {
                'Cookie': `token=${accessToken}`
            },
            redirect: 'manual'
        });

        if (res.status === 307 || res.status === 302) {
            console.log('✅ RBAC Success: Redirected (Student cannot access Admin)');
        } else if (res.status === 200) {
            // Middleware might return next() if logic is flawed, or if it rewrites.
            // If we get 200, we need to check if we are on the dashboard or login page (if redirected internally).
            // But redirect: manual should catch 3xx.
            console.error('❌ RBAC Fail: User got 200 OK on Admin Route (Check Middleware)');
        } else {
            console.log(`ℹ️ RBAC Status: ${res.status}`);
        }
    } catch (e) {
        console.error('❌ RBAC Test Error:', e);
    }

    // 5. Test Logout
    console.log('\n5. Testing Logout...');
    try {
        const res = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Cookie': `token=${accessToken}`
            }
        });

        if (res.status === 200) {
            console.log('✅ Logout Successful (200 OK)');
            // Check headers for Get-Cookie clearing
            const setCookie = res.headers.get('set-cookie');
            if (setCookie && setCookie.includes('Max-Age=0')) {
                console.log('✅ Cookies Cleared');
            } else {
                console.warn('⚠️ Cookie Clearing not explicitly detected in headers (Check implementation)');
            }
        } else {
            console.error('❌ Logout Failed:', res.status);
        }
    } catch (e) {
        console.error('❌ Logout Error:', e);
    }
}

verifyAuth();
