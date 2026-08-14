const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Parse .env.local manually
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
            // Remove leading/trailing quotes if present
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
    const env = loadEnv();
    const dbUrl = env.DATABASE_URL;
    if (!dbUrl) {
        console.error('Error: DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    console.log('Connecting to database...');
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
        console.log('Connected successfully!');

        // 2. Read and run schema migrations
        const migrationPath = path.join(__dirname, '../../supabase/migrations/00001_create_schema.sql');
        console.log('Reading migration file...');
        const sqlSchema = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing schema migrations (tables, triggers, policies)...');
        await client.query(sqlSchema);
        console.log('Schema created successfully!');

        // 3. Seed Schedule Configurations
        console.log('Seeding schedule configurations...');
        const scheduleConfigs = [
            { title: 'Mangala Arati & Tulasi Puja', type: 'arati', start_time_local: '04:30:00', end_time_local: '05:00:00', is_mandatory: true },
            { title: 'Japa Session', type: 'japa', start_time_local: '05:00:00', end_time_local: '07:15:00', is_mandatory: true },
            { title: 'Darshan & Shringara Arati', type: 'darshan', start_time_local: '07:15:00', end_time_local: '07:30:00', is_mandatory: true },
            { title: 'Morning Lecture / scheduled lecture', type: 'lecture', start_time_local: '07:30:00', end_time_local: '08:30:00', is_mandatory: true },
            { title: 'Raja-Bhoga / Bhoga offering', type: 'bhoga', start_time_local: '12:30:00', end_time_local: '13:00:00', is_mandatory: true },
            { title: 'Rest period', type: 'rest', start_time_local: '13:00:00', end_time_local: '16:00:00', is_mandatory: false },
            { title: 'Afternoon Darshan & Dhoop Arati', type: 'darshan', start_time_local: '16:15:00', end_time_local: '16:45:00', is_mandatory: true },
            { title: 'Sandhya & Gaura Arati', type: 'arati', start_time_local: '19:00:00', end_time_local: '19:30:00', is_mandatory: true },
            { title: 'Evening Lecture (7:30 PM)', type: 'lecture', start_time_local: '19:30:00', end_time_local: '20:15:00', is_mandatory: false },
            { title: 'Evening Lecture (8:30 PM)', type: 'lecture', start_time_local: '20:30:00', end_time_local: '21:15:00', is_mandatory: false },
            { title: 'Shayana Arati', type: 'arati', start_time_local: '21:15:00', end_time_local: '21:30:00', is_mandatory: true }
        ];

        for (const config of scheduleConfigs) {
            await client.query(`
                INSERT INTO public.schedule_configs (title, type, start_time_local, end_time_local, is_mandatory)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (title) DO UPDATE SET
                    type = EXCLUDED.type,
                    start_time_local = EXCLUDED.start_time_local,
                    end_time_local = EXCLUDED.end_time_local,
                    is_mandatory = EXCLUDED.is_mandatory
            `, [config.title, config.type, config.start_time_local, config.end_time_local, config.is_mandatory]);
        }
        console.log('Seeded schedule configurations.');

        // 4. Seed Devotional Content (Aartis, Prayers, Bhoga)
        console.log('Seeding devotional content...');
        const devotionalContent = [
            {
                title: 'Sri Gurvastakam',
                transliteration: `(1) samsara-davanala-lidha-loka-tranaya karunya-ghanaghanatwam...`,
                original_text: `samsara-davanala-lidha-loka-tranaya karunya-ghanaghanatwam
praptasya kalyana-gunarnavasya vande guroh sri-charanaravindam...`,
                translation: `The spiritual master is receiving benediction from the ocean of mercy. Just as a cloud pours water on a forest fire to extinguish it, so the spiritual master delivers the materially afflicted world by extinguishing the blazing fire of material existence.`,
                display_order: 1,
                source_reference: 'Srila Vishvanatha Chakravarti Thakura',
                type: 'Guru',
                associated_program: 'Mangala Arati',
                approved: true
            },
            {
                title: 'Sri Tulasi-Aarti & Pranama',
                transliteration: `namo namah tulasi krishna-preyasi namo namah...`,
                original_text: `namo namah tulasi krishna-preyasi namo namah
radha-krishna-seva pabo ei abilashi...

vṛndāyai tulasī-devyai priyāyai keśavasya ca
viṣṇu-bhakti-prade devī satya vatyai namo namaḥ

yāni kāni ca pāpāni brahma-hatyādikāni ca
tāni tāni praṇaśyanti pradakṣiṇaḥ pade pade`,
                translation: `O Tulasi, beloved of Krishna, I bow before you again and again. My desire is to obtain the service of Sri Sri Radha and Krishna. I offer my repeated obeisances unto Vrinda, Srimati Tulasi Devi... By the circumambulation of Srimati Tulasi Devi all sins are destroyed.`,
                display_order: 2,
                source_reference: 'Traditional Gaudiya Vaishnava Prayers',
                type: 'Tulasi',
                associated_program: 'Mangala Arati',
                approved: true
            },
            {
                title: 'Sri Nrsimha Pranama',
                transliteration: `namas te narasimhaya prahladahlada-dayine...`,
                original_text: `namas te narasimhaya
prahladahlada-dayine
hiranyakasipor vakshahsila-
tanka-nakhalaye...`,
                translation: `I offer my obeisances to Lord Narasimha who gives joy to Prahlada Maharaja and whose nails are like chisels on the stonelike chest of the demon Hiranyakasipu.`,
                display_order: 3,
                source_reference: 'Srimad-Bhagavatam / Vaishnava Songs',
                type: 'Nrsimha',
                associated_program: 'Mangala Arati',
                approved: true
            },
            {
                title: 'Prayer to Lord Nrsimha',
                transliteration: `tava kara-kamala-vare nakham adbhuta-sringam...`,
                original_text: `tava kara-kamala-vare nakham adbhuta-sringam
dalita-hiranyakasipu-tanu-bhringam
kesava dhrita-narahari-rupa jaya jagadisa hare`,
                translation: `O Kesava! O Lord of the universe! O Lord Hari, who have assumed the form of half-man, half-lion! All glories to You! Just as one can easily crush a wasp between one’s fingernails, so in the same way the body of the wasplike demon Hiranyakasipu has been ripped apart by the wonderful pointed nails on Your beautiful lotus hands.`,
                display_order: 4,
                source_reference: 'Sri Dasavatara Stotra by Jayadeva Gosvami',
                type: 'Nrsimha',
                associated_program: 'Mangala Arati',
                approved: true
            },
            {
                title: 'Gaura Arati',
                transliteration: `(1) (kiba) jaya jaya goracander aratiko sobha
jahnavi-tata-vane jaga-mana-lobha...`,
                original_text: `(kiba) jaya jaya goracander aratiko sobha
jahnavi-tata-vane jaga-mana-lobha...`,
                translation: `All glories, all glories to the beautiful arati ceremony of Lord Caitanya. This Gaura-arati is taking place in a grove on the banks of the Jahnavi [Ganges] and is attracting the minds of all living entities in the universe.`,
                display_order: 5,
                source_reference: 'Srila Bhaktivinoda Thakura (Gitavali)',
                type: 'Aarti',
                associated_program: 'Gaura Arati',
                approved: true
            },
            {
                title: 'Vaishnave Vijnapti',
                transliteration: `(1) ei-baro karuna koro vaishnava gosai...`,
                original_text: `ei-baro karuna koro vaishnava gosai
patita-pavana toma bine keho nai...`,
                translation: `O Vaishnava Gosvami, please be merciful to me now. There is no one except you who can purify the fallen souls.`,
                display_order: 6,
                source_reference: 'Srila Narottama dasa Thakura (Prarthana)',
                type: 'Prayer',
                associated_program: 'Gaura Arati',
                approved: true
            },
            {
                title: 'Mandatory Aarti Closing (Jaya Sequence)',
                transliteration: `Jaya Paramahamsa Parivrajakacarya...`,
                original_text: `Jaya Paramahamsa Parivrajakacarya...
Bhaktivedanta Swami Maharaja ki jaya

Ananta koti vaisnava vrinda ki jaya
Namacarya Srila Haridasa Thakura ki jaya

Prem se kaho Sri Krsna Caitanya Prabhu Nityananda
Sri Advaita Gadadhara Srivasadi Gaura Bhakta Vrinda ki jaya

Sri Sri Radha Krsna Gopa Gopinatha
Syama Kunda Radha Kunda Giri Govardhana ki jaya

Vrindavana dhama ki jaya
Navadvipa dhama ki jaya
Ganga mayi ki jaya
Jamuna mayi ki jaya`,
                translation: `All glories to the assembled devotees. Thank you very much.`,
                display_order: 7,
                source_reference: 'JAGA Mandatory Closing standard',
                type: 'Jaya',
                associated_program: 'Gaura Arati',
                approved: true
            },
            {
                title: 'Bhoga Offering Procedure',
                transliteration: `1. Chant Srila Prabhupada Prayer 3x ...`,
                original_text: `Srila Prabhupada Pranati:
nama om visnu-padaya krsna-presthaya bhu-tale
srimate bhaktivedanta-svamin iti namine
namas te sarasvate deve gaura-vani-pracarine
nirvisesa-sunyavadi-pascatya-desa-tarine

Sri Caitanya Pranati:
namo maha-vadanyaya krsna-prema-pradaya te
krsnaya krsna-caitanya-namne gaura-tvise namah

Sri Krishna Pranati:
he krsna karuna-sindho dina-bandho jagat-pate
gopesa gopika-kanta radha-kanta namo 'stu te

Pancha Tattva Mantra:
sri-krsna-caitanya prabhu-nityananda
sri-advaita gadadhara srivasadi-gaura-bhakta-vrinda

Hare Krishna Mahamantra:
hare krsna hare krsna krsna krsna hare hare
hare rama hare rama rama rama hare hare`,
                translation: `Perform the offering with love and devotion. Wave a flower or incense while chanting. Let the bhoga stand for 10-15 minutes before offering prayers of gratitude.`,
                display_order: 8,
                source_reference: 'ISKCON / Srila Prabhupada Authorized procedure',
                type: 'Prasadam',
                associated_program: 'Bhoga Offering',
                approved: true
            }
        ];

        for (const content of devotionalContent) {
            await client.query(`
                INSERT INTO public.devotional_content (title, transliteration, original_text, translation, display_order, source_reference, type, associated_program, approved)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (title) DO UPDATE SET
                    transliteration = EXCLUDED.transliteration,
                    original_text = EXCLUDED.original_text,
                    translation = EXCLUDED.translation,
                    display_order = EXCLUDED.display_order,
                    source_reference = EXCLUDED.source_reference,
                    type = EXCLUDED.type,
                    associated_program = EXCLUDED.associated_program,
                    approved = EXCLUDED.approved
            `, [
                content.title,
                content.transliteration,
                content.original_text,
                content.translation,
                content.display_order,
                content.source_reference,
                content.type || 'Prayer',
                content.associated_program || null,
                content.approved !== undefined ? content.approved : true
            ]);
        }
        console.log('Seeded devotional content successfully.');

        // 5. Seed Book References
        console.log('Seeding book references...');
        const bookReferences = [
            { book_title: 'Bhagavad-gita As It Is', chapter_section: 'Chapter 1 to 18', url: 'https://vedabase.io/en/library/bg/', description: 'The primary text of devotional science containing the direct conversation between Lord Krishna and Arjuna.' },
            { book_title: 'Srimad-Bhagavatam', chapter_section: 'Cantos 1 to 12', url: 'https://vedabase.io/en/library/sb/', description: 'The spotless purana describing the glories of the Supreme Lord and His devotees.' },
            { book_title: 'Sri Caitanya-caritamrta', chapter_section: 'Adi, Madhya, Antya Lila', url: 'https://vedabase.io/en/library/cc/', description: 'The biography and teachings of Lord Sri Chaitanya Mahaprabhu.' },
            { book_title: 'Krsna, the Supreme Personality of Godhead', chapter_section: 'Volume 1 & 2', url: 'https://vedabase.io/en/library/kb/', description: 'Summary study of Srimad-Bhagavatam Tenth Canto describing Lord Krishna\'s Vrindavan and Dwaraka pastimes.' }
        ];

        for (const book of bookReferences) {
            await client.query(`
                INSERT INTO public.book_references (book_title, chapter_section, url, description)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (book_title) DO UPDATE SET
                    chapter_section = EXCLUDED.chapter_section,
                    url = EXCLUDED.url,
                    description = EXCLUDED.description
            `, [book.book_title, book.chapter_section, book.url, book.description]);
        }
        console.log('Seeded book references successfully.');

        // 6. Seed Lectures (Full Structured Category-Wise Ingestion)
        console.log('Seeding comprehensive library lectures...');
        const initialLectures = [
            {
                title: 'Introduction to Bhagavad Gita As It Is',
                description: 'Overview of the primary teachings of Bhagavad Gita, the difference between body and soul, and the path of loving service.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: '3SZG9lMv32c',
                duration_seconds: 2700,
                category: 'Bhagavad Gita',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=3SZG9lMv32c',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
            },
            {
                title: 'Why Do We Feel Hurt? - Srimad Bhagavatam Class',
                description: 'Understanding expected reactions, how material attachments cause emotional pain, and taking shelter of Srimad Bhagavatam teachings.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'gC8y61_n30E',
                duration_seconds: 3600,
                category: 'Srimad Bhagavatam',
                language: 'Hindi',
                source_channel: 'People for Krishna Consciousness',
                video_url: 'https://youtube.com/watch?v=gC8y61_n30E',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 28).toISOString()
            },
            {
                title: 'Advent of Lord Krishna - Krishna Book Lecture',
                description: 'Deconstructs the appearance of Lord Krishna, His early pastimes, and the deep theological concepts detailed in the Krishna Book.',
                speaker: 'A.C. Bhaktivedanta Swami Prabhupada',
                youtube_video_id: 'QZJ1g-yCgsw',
                duration_seconds: 2400,
                category: 'Krishna Book',
                language: 'English',
                source_channel: 'Srila Prabhupada Lectures',
                video_url: 'https://youtube.com/watch?v=QZJ1g-yCgsw',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 26).toISOString()
            },
            {
                title: 'The Greatness of Harinam Japa',
                description: 'Focus on clearing mental distractions during Japa and establishing a deep personal connection with the holy name.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'yvP62XzM-4A',
                duration_seconds: 1800,
                category: 'Japa / Harinama',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=yvP62XzM-4A',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 24).toISOString()
            },
            {
                title: 'Necessity of Accepting a Spiritual Master',
                description: 'A study of why accepting a bonafide spiritual master is necessary for spiritual success as described in HBV Vilasa 1.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'MTcPrTIBkpA',
                duration_seconds: 2100,
                category: 'Guru',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=MTcPrTIBkpA',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 22).toISOString()
            },
            {
                title: 'Understanding the Position of Sri Guru (Guru Tattva)',
                description: 'Deconstructs the spiritual master\'s role as the external manifestation of the supersoul and the absolute truth.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'DJvM2lSPn6w',
                duration_seconds: 2400,
                category: 'Guru Tattva',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=DJvM2lSPn6w',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 20).toISOString()
            },
            {
                title: 'Stages of Devotional Service (Saddha to Prema)',
                description: 'Detailed analysis of Rupa Gosvami\'s progressive steps of Bhakti-yoga from initial faith to pure love of Godhead.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'YQMSietiFm0',
                duration_seconds: 2500,
                category: 'Bhakti',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=YQMSietiFm0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 18).toISOString()
            },
            {
                title: 'Daily Sadhana and Spiritual Discipline',
                description: 'Practical guidelines on waking early, maintaining cleanliness, and establishing a daily routine for steady bhakti.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'sIVL4JMqRfc',
                duration_seconds: 2200,
                category: 'Sadhana',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=sIVL4JMqRfc',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 16).toISOString()
            },
            {
                title: 'Qualities of a True Vaishnava',
                description: 'Highlights the twenty-six qualities of a devotee, focusing on humility, truthfulness, and compassion.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: '19g66ezsKAg',
                duration_seconds: 2000,
                category: 'Vaishnava',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=19g66ezsKAg',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
            },
            {
                title: 'Understanding Vaishnava Etiquette',
                description: 'A study of traditional devotee relationships, respect, cleanliness, and humbleness in devotional service.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: '8Y6Y8v_p450',
                duration_seconds: 1500,
                category: 'Vaishnava Etiquette',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=8Y6Y8v_p450',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 12).toISOString()
            },
            {
                title: 'Honoring Prasadam: Spiritualizing Our Eating Habits',
                description: 'Explains the spiritual benefits of honoring sanctified food offerings and avoiding material sense indulgence.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'pqMqn9fKEf8',
                duration_seconds: 1800,
                category: 'Prasadam',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=pqMqn9fKEf8',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
            },
            {
                title: 'How to Offer Food (Bhoga) to the Lord',
                description: 'A step-by-step practical guide to offering home-cooked meals to Lord Krishna with authorized mantras.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'L8_98i_bMMA',
                duration_seconds: 1600,
                category: 'Bhoga',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=L8_98i_bMMA',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 8).toISOString()
            },
            {
                title: 'Glories and Rules of Ekadashi Fasting',
                description: 'Detailed scriptural guidelines for calculating and observing the holy fast days of Ekadashi.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'AtsX0dPCG_4',
                duration_seconds: 2400,
                category: 'Ekadashi',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=AtsX0dPCG_4',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 6).toISOString()
            },
            {
                title: 'Glories of Sri Vrindavan Dham',
                description: 'Eulogizes the transcendental land of Vrindavan and the correct mood when visiting holy places.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: '9auOCbH5Ns4',
                duration_seconds: 3000,
                category: 'Vrindavan',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=9auOCbH5Ns4',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
            },
            {
                title: 'Appearance and Pastimes of Lord Nrsimhadeva',
                description: 'Chronicles the pastimes of the half-lion incarnation who protected Prahlada Maharaja and destroyed demoniac forces.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: '7cC3_jGwl_U',
                duration_seconds: 2800,
                category: 'Nrsimha',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=7cC3_jGwl_U',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
            },
            {
                title: 'Pastimes of Lord Ramacandra',
                description: 'Exposition on the Ramayana, tracing the path of righteousness and surrender demonstrated by Lord Rama.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'wyKQe_i9yyo',
                duration_seconds: 2900,
                category: 'Ramayana',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=wyKQe_i9yyo',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
            },
            {
                title: 'Vaishnava Bhajans: Deep Meaning and Chanting',
                description: 'Deconstructs the compositions of Narottama Das Thakura and Bhaktivinoda Thakura.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'djKq8f4tT3Q',
                duration_seconds: 1900,
                category: 'Vaishnava Bhajans',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=djKq8f4tT3Q',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 12).toISOString()
            },
            {
                title: 'The Power of Congregational Kirtan',
                description: 'Exposes how congregational singing of the holy names cleanses the mirror of the heart in Kali-yuga.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'k1tP8fY2_7w',
                duration_seconds: 2100,
                category: 'Kirtan',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=k1tP8fY2_7w',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 6).toISOString()
            },
            {
                title: 'Importance of Reading Srila Prabhupada\'s Books',
                description: 'An analysis of how daily book reading builds a strong philosophical foundation against mental speculation.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'b8Pq9jY3Xf0',
                duration_seconds: 2200,
                category: 'Book Reading',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=b8Pq9jY3Xf0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                title: 'Correct Pronunciation of Vedic Mantras',
                description: 'A study of Sanskrit metrics and standard styles of reciting Mangalacharana and Sandhya prayers.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'm5p9jK2_9Xw',
                duration_seconds: 1800,
                category: 'Mantra Recitation',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=m5p9jK2_9Xw',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 3600000 * 1).toISOString()
            },
            {
                title: 'Celebrating Vaishnava Festivals in Devotion',
                description: 'Explains how active participation in temple festivals fuels devotee relationships and group cohesion.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'f7q8jT2_4X0',
                duration_seconds: 2400,
                category: 'Festivals',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=f7q8jT2_4X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 1800000).toISOString()
            },
            {
                title: 'Understanding the Appearance of Incarnations',
                description: 'Explores the Gita verse detailing the Lord\'s descent to protect the pious and re-establish dharma.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'a9p8jK2_7X0',
                duration_seconds: 2300,
                category: 'Appearance Days',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=a9p8jK2_7X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 900000).toISOString()
            },
            {
                title: 'Glories of Acharyas on Their Disappearance Days',
                description: 'Deep discussion on how separation from advanced Vaisnava acharyas creates profound spiritual ecstasies.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'd8p9jM2_5Xw',
                duration_seconds: 2500,
                category: 'Disappearance Days',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=d8p9jM2_5Xw',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 600000).toISOString()
            },
            {
                title: 'Principles of Progressive Devotional Life',
                description: 'How to manage professional duties and devotee sadhana without burning out.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'p9q8jT2_6X0',
                duration_seconds: 2100,
                category: 'Devotional Life',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=p9q8jT2_6X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 300000).toISOString()
            },
            {
                title: 'Deconstruction of Acintya-Bheda-Abheda Philosophy',
                description: 'Philosophical deconstruction of Lord Chaitanya\'s teaching of simultaneous oneness and difference.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'ph9p8jK2_8X0',
                duration_seconds: 2700,
                category: 'Philosophy',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=ph9p8jK2_8X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 120000).toISOString()
            },
            {
                title: 'Youth Outreach and Staying Strong in Bhakti',
                description: 'Special guidance for students facing high-pressure academic or corporate settings.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'yo9p8jM2_9Xw',
                duration_seconds: 2200,
                category: 'Youth',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=yo9p8jM2_9Xw',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 60000).toISOString()
            },
            {
                title: 'Q&A Session: Resolving Devotional Doubts',
                description: 'Interactive session answering modern questions on diet, daily logs, and spiritual progression.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'qa9p8jT2_5X0',
                duration_seconds: 1800,
                category: 'Q&A',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=qa9p8jT2_5X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 10000).toISOString()
            },
            {
                title: 'Special Discourses on Vaishnava Culture',
                description: 'Special program detailing historical developments and cultural evolution of deity worship standards.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'sp9p8jK2_7X0',
                duration_seconds: 2600,
                category: 'Special Programs',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=sp9p8jK2_7X0',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 5000).toISOString()
            },
            {
                title: 'Glories of Vaishnava Association',
                description: 'Why honoring Vaisnavas and avoiding offense is the primary shield for bhakti progression.',
                speaker: 'HG Goloka Vrindavan Das',
                youtube_video_id: 'ot9p8jM2_5Xw',
                duration_seconds: 2000,
                category: 'Other',
                language: 'Hindi',
                source_channel: 'Golok Vrindavan Das',
                video_url: 'https://youtube.com/watch?v=ot9p8jM2_5Xw',
                approval_status: 'approved',
                scheduled_start: new Date(Date.now() - 1000).toISOString()
            }
        ];

        for (const lecture of initialLectures) {
            await client.query(`
                INSERT INTO public.lectures (title, description, speaker, youtube_video_id, duration_seconds, category, language, scheduled_start, contemplation_required, active, source_channel, video_url, approval_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (youtube_video_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    speaker = EXCLUDED.speaker,
                    duration_seconds = EXCLUDED.duration_seconds,
                    category = EXCLUDED.category,
                    language = EXCLUDED.language,
                    scheduled_start = EXCLUDED.scheduled_start,
                    contemplation_required = EXCLUDED.contemplation_required,
                    active = EXCLUDED.active,
                    source_channel = EXCLUDED.source_channel,
                    video_url = EXCLUDED.video_url,
                    approval_status = EXCLUDED.approval_status
            `, [
                lecture.title,
                lecture.description,
                lecture.speaker,
                lecture.youtube_video_id,
                lecture.duration_seconds,
                lecture.category,
                lecture.language,
                lecture.scheduled_start,
                lecture.contemplation_required !== undefined ? lecture.contemplation_required : true,
                lecture.active !== undefined ? lecture.active : true,
                lecture.source_channel,
                lecture.video_url,
                lecture.approval_status
            ]);
        }
        console.log('Seeded initial lectures successfully.');

    } catch (err) {
        console.error('Error during migration and seeding:', err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

run();
