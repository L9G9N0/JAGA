# JAGA — Devotional Discipline and Learning Platform

JAGA is a production-ready devotional discipline and learning platform built for a small initial community of approximately 30 devotees. It enforces daily routines, Japa chanting participation, synchronized lecture watching, and Guru/Admin supervision with absolute accountability.

## Key Features

1.  **Strict Attendance Tracking:** Dashboard routine slots compute devotee arrival times against daily schedule configs in the `Asia/Kolkata` timezone (IST).
2.  **Synchronized Lecture Engine:** Late-joining devotees are automatically synced to the current elapsed broadcast time. Rewinding, scrubbing, and fast-forwarding are disabled.
3.  **Live Japa Audio Room:** Audio-only chanting room powered by LiveKit Cloud, with connection audits (join/leave, duration, reconnects) and Zoom link fallback.
4.  **Mala & Daily Reports:** Devotees submit their daily Mala round logs and sadhana checklists. Cutoff times (10:00 PM cutoff for daily reports) are enforced server-side.
5.  **Lecture Recovery Workflow:** Missed lectures trigger a recovery request form. Once approved by the Guru, devotees can watch the replay, but their status is saved permanently as `recovery_completed` in historical compliance logs.
6.  **Guru / Admin supervision:** Controls for verifying pending waitlist devotees (setting Japa rounds), reviewing recovery requests, changing schedule configs, scheduling new lectures, and auditing logs.
7.  **Public References:** Approved reference pages for Sandhya Aartis (including the ending Jaya sequence), Bhoga offering guidelines, Vedabase book links, and categorized lecture replay libraries.

## Architecture & Security

*   **Next.js 16 (App Router):** Leverages async cookies, Server Actions, and Route Handlers.
*   **Supabase SSR:** Fully manages session validation and database operations.
*   **Row-Level Security (RLS):** Enabled on all 11 core tables. Checked via a custom security definer helper to prevent infinite recursion loop flags.
*   **Role Update Protection:** Database triggers block unprivileged profiles from changing their roles or Japa counts.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

DATABASE_URL=postgresql://postgres.your-supabase-id:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### 3. Database Migration and Seeding
Deploy the SQL schema and populate standard daily slots, Aartis, book references, and initial lectures:
```bash
node src/scripts/migrate-and-seed.js
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Running the Automated Test Suite

We have created an automated test script checking synchronized lecture offsets, boundaries, deadlines, and database function permissions:
```bash
node src/scripts/run-tests.js
```
All 10 test specs must output **[PASS]**.

---

## Building for Production

Ensure that the compilation succeeds without errors:
```bash
npm run build
```
The output builds static and server-rendered App Router chunks, ready for deployment on platforms like Vercel.
