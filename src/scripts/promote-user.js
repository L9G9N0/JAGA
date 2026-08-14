const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env.local manually
function loadEnv() {
    const envPath = path.join(__dirname, '../../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env.local file not found at', envPath);
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
    if (atIndex === -1) throw new Error('Invalid connection string: no @ separator');
    
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

async function run() {
    const args = process.argv.slice(2);
    const email = args[0];
    const role = args[1]; // 'admin' or 'guru' or 'devotee'

    if (!email || !role) {
        console.log('Usage: node src/scripts/promote-user.js <email> <admin|guru|devotee>');
        process.exit(1);
    }

    if (!['admin', 'guru', 'devotee'].includes(role)) {
        console.error('Error: Role must be admin, guru, or devotee');
        process.exit(1);
    }

    const env = loadEnv();
    const dbUrl = env.DATABASE_URL;
    if (!dbUrl) {
        console.error('Error: DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    console.log(`Connecting to database to promote ${email} to ${role}...`);
    let clientConfig;
    try {
        clientConfig = parseConnectionString(dbUrl);
        clientConfig.ssl = { rejectUnauthorized: false };
    } catch (e) {
        console.error('Error parsing DATABASE_URL:', e.message);
        process.exit(1);
    }
    const client = new Client(clientConfig);

    try {
        await client.connect();
        
        // Find profile
        const { rows } = await client.query('SELECT id, role, full_name FROM public.profiles WHERE email = $1', [email]);
        if (rows.length === 0) {
            console.error(`Error: No profile found for email ${email}. Has this user signed up?`);
            process.exit(1);
        }

        const profile = rows[0];
        console.log(`Found profile: ${profile.full_name} (${profile.id}) currently with role ${profile.role}`);

        // Update role directly (bypassing triggers because we run with full database owner access)
        const updateResult = await client.query(
            'UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE email = $2 RETURNING *',
            [role, email]
        );

        if (updateResult.rowCount === 1) {
            console.log(`Success! User ${email} has been promoted to ${role}.`);
        } else {
            console.error('Error: Failed to update role.');
        }

    } catch (err) {
        console.error('Database error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
