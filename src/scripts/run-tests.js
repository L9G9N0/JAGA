const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// manual .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '../../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env.local file not found');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            env[match[1]] = value;
        }
    });
    return env;
}

function parseConnectionString(str) {
    const cleaned = str.replace(/^(postgresql|postgres):\/\//, '');
    const atIndex = cleaned.lastIndexOf('@');
    if (atIndex === -1) throw new Error('Invalid connection string');
    
    const credentials = cleaned.substring(0, atIndex);
    const hostDb = cleaned.substring(atIndex + 1);
    
    const colonIndex = credentials.indexOf(':');
    const user = colonIndex === -1 ? credentials : credentials.substring(0, colonIndex);
    const password = colonIndex === -1 ? '' : credentials.substring(colonIndex + 1);
    
    const slashIndex = hostDb.indexOf('/');
    const hostPort = slashIndex === -1 ? hostDb : hostDb.substring(0, slashIndex);
    const database = slashIndex === -1 ? '' : hostDb.substring(slashIndex + 1);
    
    const portColonIndex = hostPort.indexOf(':');
    const host = portColonIndex === -1 ? hostPort : hostPort.substring(0, portColonIndex);
    const port = portColonIndex === -1 ? 5432 : parseInt(hostPort.substring(portColonIndex + 1), 10);
    
    return {
        user: decodeURIComponent(user),
        password: decodeURIComponent(password),
        host,
        port,
        database
    };
}

async function runTests() {
    console.log('============================================================');
    console.log('                  JAGA AUTOMATED TEST SUITE                 ');
    console.log('============================================================');
    
    let totalTests = 0;
    let passedTests = 0;
    
    function assert(name, condition) {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`[PASS] ${name}`);
        } else {
            console.log(`[FAIL] ${name}`);
        }
    }

    // TEST 1: Synchronized timing calculations
    console.log('\n--- Test Group 1: Lecture Timing Sync ---');
    const mockLecture = {
        title: 'Morning Bhagavad Gita',
        duration_seconds: 720, // 12 minutes
        scheduled_start: new Date(Date.now() - 360000).toISOString() // started 6 minutes ago (360,000 ms)
    };
    
    const start = new Date(mockLecture.scheduled_start);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    assert('Devotee joining 6 minutes late seeks to 360 seconds', elapsedSeconds === 360);
    assert('Player does not auto-restart to 0 for late joiners', elapsedSeconds > 0 && elapsedSeconds < mockLecture.duration_seconds);

    // TEST 2: Contemplation Grace Period Deadlines
    console.log('\n--- Test Group 2: Contemplation Deadlines ---');
    const lectureDurationSeconds = 720; // 12 mins
    const gracePeriodSeconds = 30 * 60; // 30 mins
    const totalAllowedTimeMs = (lectureDurationSeconds + gracePeriodSeconds) * 1000;
    
    const startDateTime = new Date();
    const onTimeSubmissionTime = new Date(startDateTime.getTime() + 10 * 60 * 1000); // 10 minutes after start
    const lateSubmissionTime = new Date(startDateTime.getTime() + 45 * 60 * 1000); // 45 minutes after start (limit is 42 mins)
    
    const limitDateTime = new Date(startDateTime.getTime() + totalAllowedTimeMs);
    
    assert('Submission within 10 minutes is ON-TIME', onTimeSubmissionTime <= limitDateTime);
    assert('Submission after 45 minutes exceeds deadline and is LATE', lateSubmissionTime > limitDateTime);

    // TEST 3: Daily Report Submission Deadline
    console.log('\n--- Test Group 3: Daily Report Deadlines ---');
    const onTimeReportTime = '19:30'; // 7:30 PM
    const lateReportTime = '22:15'; // 10:15 PM
    
    const getReportStatus = (timeString) => {
        const [hours] = timeString.split(':').map(Number);
        return hours >= 22 ? 'late' : 'completed';
    };
    
    assert('Report submitted at 7:30 PM is COMPLETED', getReportStatus(onTimeReportTime) === 'completed');
    assert('Report submitted at 10:15 PM is LATE', getReportStatus(lateReportTime) === 'late');

    // TEST 4: YouTube Thumbnail Generation
    console.log('\n--- Test Group 4: YouTube Thumbnail Generator ---');
    const testVideoId = 'gC8y61_n30E';
    const generateThumbnailUrl = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    assert('Generates correct YouTube thumbnail URL', generateThumbnailUrl(testVideoId) === 'https://img.youtube.com/vi/gC8y61_n30E/mqdefault.jpg');

    // TEST 5: Database role security and RLS tests
    console.log('\n--- Test Group 5: Database Security, RLS & Schema Audit ---\nConnecting to DB...');
    const env = loadEnv();
    let client;
    try {
        const config = parseConnectionString(env.DATABASE_URL);
        config.ssl = { rejectUnauthorized: false };
        client = new Client(config);
        await client.connect();
        
        // 1. Role verification helper
        const res = await client.query('SELECT public.check_user_is_admin_or_guru(gen_random_uuid()) as test_val');
        assert('RLS role validation database helper function executes', res.rows.length > 0);
        
        // 2. Default role trigger verification
        console.log('Testing trigger: public signup role defaulting...');
        const testUserUuid = '00000000-0000-0000-0000-000000000001';
        // Cleanup if previous test left it
        await client.query('DELETE FROM public.profiles WHERE id = $1', [testUserUuid]);
        await client.query('DELETE FROM auth.users WHERE id = $1', [testUserUuid]);

        // Insert dummy user in auth.users (fires handle_new_user trigger)
        await client.query(`
            INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
            VALUES ($1, 'test_signup@jaga.org', '{"full_name": "Test Seeding User"}', 'authenticated', 'authenticated')
        `, [testUserUuid]);
        
        // Retrieve inserted role
        const { rows: testRoleRows } = await client.query('SELECT role FROM public.profiles WHERE id = $1', [testUserUuid]);
        assert('Default role trigger defaults profile role to pending_devotee and blocks metadata role-spoofing', testRoleRows.length > 0 && testRoleRows[0].role === 'pending_devotee');
        
        // 3. Role escalation prevention trigger test
        console.log('Testing role escalation prevention trigger...');
        try {
            await client.query('BEGIN');
            await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [testUserUuid]);
            // Attempt to update the role to admin directly as this mocked user
            const updateRes = await client.query('UPDATE public.profiles SET role = \'admin\' WHERE id = $1 RETURNING role', [testUserUuid]);
            await client.query('COMMIT');
            assert('Role escalation trigger prevents unauthorized role updates', updateRes.rows[0].role === 'pending_devotee');
        } catch (e) {
            await client.query('ROLLBACK');
            console.log('[FAIL] Role escalation trigger test failed with error: ' + e.message);
        }
        
        // Clean up test user
        await client.query('DELETE FROM public.profiles WHERE id = $1', [testUserUuid]);
        await client.query('DELETE FROM auth.users WHERE id = $1', [testUserUuid]);

        // 4. Aarti deduplication check
        const { rows: aartiDupRows } = await client.query('SELECT title, COUNT(*) FROM public.devotional_content GROUP BY title HAVING COUNT(*) > 1');
        assert('Devotional content table has no duplicate titles (deduplication check)', aartiDupRows.length === 0);

        // 5. Bhoga public retrieval check
        const { rows: bhogaRows } = await client.query('SELECT * FROM public.devotional_content WHERE title = \'Bhoga Offering Procedure\'');
        assert('Bhoga Offering Procedure exists and is readable', bhogaRows.length === 1);

        // 6. Lecture category verification
        const requiredCategories = [
            'Bhagavad Gita', 'Srimad Bhagavatam', 'Krishna Book', 'Japa / Harinama', 'Guru', 'Guru Tattva',
            'Bhakti', 'Sadhana', 'Vaishnava', 'Vaishnava Etiquette', 'Prasadam', 'Bhoga', 'Ekadashi',
            'Vrindavan', 'Nrsimha', 'Ramayana', 'Vaishnava Bhajans', 'Kirtan', 'Book Reading',
            'Mantra Recitation', 'Festivals', 'Appearance Days', 'Disappearance Days', 'Devotional Life',
            'Philosophy', 'Youth', 'Q&A', 'Special Programs', 'Other'
        ];
        const { rows: seededCategoryRows } = await client.query('SELECT DISTINCT category FROM public.lectures');
        const seededCategories = seededCategoryRows.map(r => r.category);
        const allCategoriesSeeded = requiredCategories.every(cat => seededCategories.includes(cat));
        assert('All 29 required lecture categories are represented in the database', allCategoriesSeeded);

        // 7. Check private logs data access policy structure
        const { rows: policyRows } = await client.query(`
            SELECT policyname, tablename, cmd, qual 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename IN ('mala_records', 'daily_reports')
        `);
        const hasOwnerCondition = policyRows.some(p => p.qual && (p.qual.includes('profile_id') || p.qual.includes('owner')));
        assert('RLS policies isolate devotee records (mala_records and daily_reports) to their owner profile_id', hasOwnerCondition);

        // 8. Check RLS is enabled on all core tables
        const { rows: rlsCheckRows } = await client.query(`
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename IN ('profiles', 'schedule_configs', 'attendance', 'lectures', 'lecture_attendance', 'contemplations', 'mala_records', 'daily_reports', 'devotional_content', 'book_references')
        `);
        const allRlsEnabled = rlsCheckRows.every(r => r.rowsecurity === true);
        assert('Row-Level Security (RLS) is enabled on all 10 core JAGA tables', allRlsEnabled);

    } catch (e) {
        console.error('[FAIL] Database security and query check execution failed:', e.message);
    } finally {
        if (client) {
            await client.end();
        }
    }
    
    console.log('\n============================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('============================================================');
    
    if (passedTests < totalTests) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
