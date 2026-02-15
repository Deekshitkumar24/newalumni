
// Remove undici import, use global fetch
const BASE_URL = 'http://localhost:3000';

async function testAuth() {
    console.log('--- Starting Auth Debug (No Deps) ---');

    // 1. Login
    console.log(`\n1. Attempting Login to ${BASE_URL}/api/auth/login...`);
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@vjit.ac.in', // Assuming this user exists
                password: 'admin123'
            })
        });

        console.log('Login Status:', loginRes.status);

        let loginBody;
        try {
            loginBody = await loginRes.json();
            console.log('Login Body:', JSON.stringify(loginBody, null, 2));
        } catch (e) {
            console.log('Login Body is not JSON:', await loginRes.text());
        }

        const setCookie = loginRes.headers.get('set-cookie');
        console.log('Set-Cookie Header:', setCookie);

        if (!loginRes.ok) {
            console.error('Login failed. Aborting.');
            return;
        }

        if (!setCookie) {
            console.error('No Set-Cookie header received!');
            return;
        }

        // Extract token
        // set-cookie can be comma separated string in Fetch API depending on implementation
        // or we need to access it differently.
        const tokenMatch = setCookie.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
            console.error('Could not extract token from cookie');
            return;
        }

        console.log('\nExtracted Token:', token.substring(0, 20) + '...');

        // 2. Access Protected Route
        console.log(`\n2. Attempting GET ${BASE_URL}/api/profile/me...`);
        const meRes = await fetch(`${BASE_URL}/api/profile/me`, {
            method: 'GET',
            headers: {
                'Cookie': `token=${token}`
            }
        });

        console.log('Me Status:', meRes.status);
        const meBody = await meRes.text();
        console.log('Me Body:', meBody);

        if (meRes.status === 200) {
            console.log('\n✅ SUCCESS: Auth flow works in backend-to-backend test.');
            console.log('Issue is likely Browser Cookie constraints (Secure flag, SameSite, etc).');
        } else {
            console.log('\n❌ FAILURE: Auth flow failed even with direct token.');
            console.log('Issue is likely Token Verification logic (Secret mismatch, etc).');
        }

    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testAuth().catch(console.error);
