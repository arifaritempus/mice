require('dotenv').config(); // Load .env from CWD

// Using native fetch (Node 18+)
const apiFetch = fetch;

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER = {
    email: `test_int_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Integration Test User',
    company_name: 'Test Corp'
};

async function runTest() {
    console.log('🚀 Starting Backend Integration Test...');
    console.log(`TARGET: ${API_URL}`);

    let token = '';
    let projectId = '';

    // 1. REGISTER
    console.log('\n1️⃣  Testing Registration...');
    try {
        const res = await apiFetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(`Registration failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('✅ Registration successful:', data.user ? data.user.email : 'OK');
    } catch (e) {
        console.error('❌ Registration Error:', e.message);
        process.exit(1);
    }

    // 2. LOGIN
    console.log('\n2️⃣  Testing Login...');
    try {
        const res = await apiFetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(`Login failed: ${res.status} ${JSON.stringify(data)}`);

        token = data.token;
        if (!token) throw new Error('No token returned!');
        console.log('✅ Login successful. Token received.');
    } catch (e) {
        console.error('❌ Login Error:', e.message);
        process.exit(1);
    }

    // 3. CREATE PROJECT
    console.log('\n3️⃣  Testing Create Project...');
    try {
        const projectData = {
            name: 'Integration Test Project',
            description: 'Created by verify-full-flow.js',
            status: 'active',
            priority: 'medium',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 86400000).toISOString()
        };

        const res = await apiFetch(`${API_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });

        const data = await res.json();
        // Allow 201 Created or 200 OK
        if (!res.ok) throw new Error(`Create Project failed: ${res.status} ${JSON.stringify(data)}`);

        projectId = data.id || (data.project ? data.project.id : null);
        console.log('✅ Project created:', projectId);
    } catch (e) {
        console.error('❌ Create Project Error:', e.message);
        // Don't exit, might be permission issue we want to log
    }

    // 4. GET PROJECTS
    console.log('\n4️⃣  Testing Get Projects...');
    try {
        const res = await apiFetch(`${API_URL}/api/projects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(`Get Projects failed: ${res.status} ${JSON.stringify(data)}`);

        console.log(`✅ Projects fetched. Count: ${Array.isArray(data) ? data.length : 'Unknown'}`);
        if (projectId) {
            const found = Array.isArray(data) && data.find(p => p.id === projectId);
            console.log(`   Target Project ${found ? 'FOUND' : 'NOT FOUND'} in list.`);
        }
    } catch (e) {
        console.error('❌ Get Projects Error:', e.message);
    }

    console.log('\n🏁 Test Complete.');
}

runTest();
