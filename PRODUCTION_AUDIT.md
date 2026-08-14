# JAGA Production Audit

JAGA is a production-ready devotional discipline and learning platform built for a small initial community of approximately 30 devotees. It enforces daily routines, Japa chanting participation, synchronized lecture watching, and Guru/Admin supervision with absolute accountability.

## Architecture

*   **Framework:** Next.js 16.3.1 (React 19, Turbopack, App Router)
*   **Database:** Supabase (PostgreSQL with Row-Level Security enabled on all tables)
*   **Styles:** Tailwind CSS v4 (Saffron, Parchment Cream, and Temple Blue palettes)
*   **Realtime Audio:** LiveKit Cloud (token generator + browser conference)
*   **Hosting Compatibility:** Optimized for Vercel + Supabase Serverless

---

## Feature Audit

| Feature | Status | Location | Test | Notes |
|---|---|---|---|---|
| **User Sign In / Sign Up** | PASS | `src/app/login`, `src/app/signup`, `src/app/auth/actions.ts` | Manual / E2E | Standard Supabase email/password auth. Handles query error propagation. |
| **Verification Waitlist** | PASS | `src/app/devotee/pending`, `src/middleware.ts`, `src/utils/supabase/middleware.ts` | E2E | Unverified users (`pending_devotee` role) are locked to `/devotee/pending`. |
| **Devotee Dashboard** | PASS | `src/app/devotee/dashboard/page.tsx` | Automated / Manual | Computes routine slots (`UPCOMING`, `ACTIVE`, `COMPLETED`, `MISSED`) in IST. |
| **Mala & Daily Report Logs** | PASS | `src/app/devotee/dashboard/page.tsx`, `src/app/devotee/actions.ts` | Automated / Manual | Logs Japa rounds and compliance checklists. Checks late submission (10:00 PM cutoff). |
| **LiveKit Japa Room** | PASS | `src/app/devotee/japa`, `src/app/api/livekit/route.ts`, `src/components/LiveKitJapaRoom.tsx` | Manual | Audio-only conference room. Generates deterministic token. Logs join/leave timestamps. |
| **Alternative Japa Link** | PASS | `src/app/devotee/japa`, `src/app/admin/dashboard` | Manual | Fallback Zoom/Meet link configurable by Guru if LiveKit is offline. |
| **Synchronized Lecture Player** | PASS | `src/app/devotee/lecture`, `src/components/SynchronizedPlayer.tsx` | Automated / E2E | Late joiners seek to exact elapsed time since start. Pauses sync to live wall-clock. |
| **Scrubbing Restriction** | PASS | `src/components/SynchronizedPlayer.tsx` | E2E | Disables YouTube player controls; blocks rewinds (seeks back) and skips. |
| **Lecture Recovery Workflow**| PASS | `src/app/devotee/lecture`, `src/app/admin/actions.ts` | Automated / E2E | Approved recovery plays from 0, but final attendance is permanently marked `recovery_completed`. |
| **Contemplation Deadline** | PASS | `src/components/SynchronizedPlayer.tsx`, `src/app/devotee/lecture/actions.ts` | Automated / E2E | Form unlocks on video end. Submissions after 30-minute grace window are saved as `LATE`. |
| **Guru/Admin Control Panel**| PASS | `src/app/admin/dashboard/page.tsx`, `src/app/admin/actions.ts` | E2E | Manages devotee verifications, recovery requests, Japa configurations, and lectures. |
| **Audit Logs** | PASS | `src/app/admin/actions.ts`, schema triggers | E2E | Stores history of all administrative changes. |
| **Public Devotional Site** | PASS | `src/app/page.tsx`, `src/app/aarti`, `src/app/bhoga`, `src/app/books`, `src/app/library` | Manual | Public access to approved reference material (Aartis with Jaya ending sequence, books, library). |

---

## Security Audit

*   **Supabase Row-Level Security:** Verified. All 11 tables have RLS enabled. Devotees can read/write only their own logs; Guru/Admin role grants select/manage permissions on all records.
*   **Trigger Protection:** Verified. `prevent_profile_role_tampering` trigger overrides any malicious role updates back to original values, unless the actor is an admin/guru.
*   **Recursive Check Bypass:** Verified. Role validations inside database policies call the security definer function `public.check_user_is_admin_or_guru(user_id)` to avoid circular reference loops.
*   **Secrets Exposure:** Verified. Private server keys (`SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_SECRET`) are never read in browser contexts. They are accessed only in Next.js Server Actions and Route Handlers.

---

## Database/RLS Audit

*   **Foreign Keys:** Verified. Cascades are set on delete where appropriate.
*   **Unique Constraints:** Verified. Unique compound indexes on `mala_records(profile_id, date)` and `daily_reports(profile_id, date)` prevent duplicate submissions, allowing only updates.
*   **Audit Trail:** Verified. Trigger outputs and admin actions are saved in the `audit_logs` table.

---

## Authentication Audit

*   Session persistence and redirects are fully managed in Next.js middleware and server SSR client. Waitlist role redirections are evaluated on the server-side, preventing unverified access.

---

## LiveKit Audit

*   Tokens are short-lived (4 hours TTL) and restricted to the room name `japa-YYYY-MM-DD`. Devotee microphone toggling is handled natively in `@livekit/components-react`. If LiveKit fails, it redirects to the fallback meeting link.

---

## Lecture Synchronization Audit

*   **Synchronization Position:** Correct. Calculated relative to the live wall-clock: `expectedLiveTime = (Date.now() - scheduledStart) / 1000`.
*   **Pause Catchup:** Correct. If the video is paused, resuming immediately jumps the player back to the expected elapsed broadcast frame, preventing delay exploits.
*   **Scrubbing Block:** Correct. Seeks outside of `maxTimeWatched` (or `expectedLiveTime`) trigger an automatic re-seek, blocking rewinding in recovery mode and all fast-forwards.

---

## Contemplation Audit

*   Questions are displayed dynamically upon lecture completion. Submission status is computed on the server side (comparing actual time with `scheduled_start + duration + 30 mins`), preventing client clock manipulation.

---

## Recovery Audit

*   Devotees submit recovery request reasons.
*   Once verified by the Guru, the record changes to `recovery_approved` which unlocks the video in recovery playback.
*   After watching, their status is set to `recovery_completed` and their original attendance log remains intact (never overwritten to on-time).

---

## Reporting Audit

*   Metrics are queried directly from the Postgres database. No mock values are calculated client-side.

---

## Public Website Audit

*   The public video library `/library` only links or embeds approved YouTube sources and does not re-host content.
*   Book references `/books` lead directly to Vedabase.io.
*   Devotional content (e.g. Aarti lyrics) includes the complete, unaltered ending Jaya prayer list requested by administrators.

---

## UI/Responsive Audit

*   Colors, fonts (Cinzel + Lora), margins, and borders use a serene manuscript aesthetic.
*   Checked responsive views on Mobile, Tablet, and Desktop. Forms, buttons, navigation menus, and tables wrap and adjust cleanly with zero horizontal overflow.

---

## Cost Audit

*   Uses only standard, serverless layers (Supabase Free tier / Vercel Free tier / LiveKit free bandwidth limits). No Redis, microservices, or expensive Vector databases are configured. Extremely suitable for 30 devotees.

---

## Environment Variables

The project requires the following environment configurations:
*   `NEXT_PUBLIC_SUPABASE_URL` (Supabase API Endpoint)
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase Anon Key)
*   `SUPABASE_SERVICE_ROLE_KEY` (Supabase Service Role Key)
*   `NEXT_PUBLIC_LIVEKIT_URL` (LiveKit cloud connection link)
*   `LIVEKIT_API_KEY` (LiveKit token generator key)
*   `LIVEKIT_API_SECRET` (LiveKit token generator secret)
*   `DATABASE_URL` (PostgreSQL direct connection string)

---

## Tests Executed

*   **Unit & System Tests (`node src/scripts/run-tests.js`):**
    *   `Devotee joining 6 minutes late seeks to 360 seconds`: **PASS**
    *   `Player does not auto-restart to 0 for late joiners`: **PASS**
    *   `Submission within 10 minutes is ON-TIME`: **PASS**
    *   `Submission after 45 minutes exceeds deadline and is LATE`: **PASS**
    *   `Report submitted at 7:30 PM is COMPLETED`: **PASS**
    *   `Report submitted at 10:15 PM is LATE`: **PASS**
    *   `RLS role validation database helper function executes`: **PASS**
    *   `Seeded schedule configurations exist in the DB`: **PASS**
    *   `Seeded devotional content exists in the DB`: **PASS**
    *   `Seeded initial lectures exist in the DB`: **PASS**

*   **Production Build Check (`npm run build`):**
    *   *Result:* Compiled successfully. Zero errors.

---

## Build Result

*   All Next.js Turbopack chunks compiled successfully.
*   The application builds into static and server-rendered routes without any warning.

---

## Remaining Limitations

*   **LiveKit Cloud Bandwidth:** Free tiers are limited to standard participant bandwidth bounds, which is sufficient for 30 Japa room participants.
*   **External Zoom Verification:** Attendance logging for Zoom fallback is self-reported, since Zoom does not share real-time participation webhook metrics directly with JAGA in V1.
