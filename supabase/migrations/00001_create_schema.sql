-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending_devotee' CONSTRAINT check_profile_role CHECK (role IN ('public', 'pending_devotee', 'devotee', 'guru', 'admin')),
    prescribed_mala INTEGER NOT NULL DEFAULT 16 CONSTRAINT check_prescribed_mala CHECK (prescribed_mala >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. SCHEDULE CONFIGS
CREATE TABLE IF NOT EXISTS public.schedule_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CONSTRAINT check_schedule_type CHECK (type IN ('arati', 'japa', 'darshan', 'bhoga', 'rest', 'lecture')),
    start_time_local TIME NOT NULL,
    end_time_local TIME NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    provider TEXT NOT NULL DEFAULT 'LIVEKIT' CONSTRAINT check_japa_provider CHECK (provider IN ('LIVEKIT', 'EXTERNAL_LINK')),
    external_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column alterations in case table already exists
ALTER TABLE public.schedule_configs ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'LIVEKIT' CONSTRAINT check_japa_provider CHECK (provider IN ('LIVEKIT', 'EXTERNAL_LINK'));
ALTER TABLE public.schedule_configs ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Enable RLS on schedule_configs
ALTER TABLE public.schedule_configs ENABLE ROW LEVEL SECURITY;

-- 3. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.schedule_configs(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CONSTRAINT check_attendance_status CHECK (status IN ('on_time', 'late', 'missed', 'excused')),
    join_time TIMESTAMPTZ,
    leave_time TIMESTAMPTZ,
    reconnections INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_profile_config_date UNIQUE (profile_id, config_id, date)
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 4. LECTURES
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    speaker TEXT NOT NULL,
    youtube_video_id TEXT NOT NULL UNIQUE,
    duration_seconds INTEGER NOT NULL CONSTRAINT check_duration CHECK (duration_seconds > 0),
    category TEXT NOT NULL DEFAULT 'Other',
    language TEXT NOT NULL DEFAULT 'Hindi',
    scheduled_start TIMESTAMPTZ NOT NULL,
    contemplation_required BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    source_channel TEXT DEFAULT 'Golok Vrindavan Das',
    video_url TEXT,
    approval_status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on lectures
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- 5. LECTURE ATTENDANCE
CREATE TABLE IF NOT EXISTS public.lecture_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CONSTRAINT check_lecture_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'late', 'missed', 'recovery_requested', 'recovery_approved', 'recovery_completed')),
    watch_duration_seconds INTEGER NOT NULL DEFAULT 0 CONSTRAINT check_watch_duration CHECK (watch_duration_seconds >= 0),
    first_joined_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    recovery_reason TEXT,
    recovery_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recovery_approved_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_profile_lecture UNIQUE (profile_id, lecture_id)
);

-- Enable RLS on lecture_attendance
ALTER TABLE public.lecture_attendance ENABLE ROW LEVEL SECURITY;

-- 6. CONTEMPLATIONS
CREATE TABLE IF NOT EXISTS public.contemplations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    submission_status TEXT NOT NULL CONSTRAINT check_contemplation_status CHECK (submission_status IN ('on_time', 'late', 'missing')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_profile_lecture_contemplation UNIQUE (profile_id, lecture_id)
);

-- Enable RLS on contemplations
ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;

-- 7. MALA RECORDS
CREATE TABLE IF NOT EXISTS public.mala_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL CONSTRAINT check_mala_count CHECK (count >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_profile_date_mala UNIQUE (profile_id, date)
);

-- Enable RLS on mala_records
ALTER TABLE public.mala_records ENABLE ROW LEVEL SECURITY;

-- 8. DAILY REPORTS
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_activities JSONB NOT NULL,
    book_reading_minutes INTEGER NOT NULL DEFAULT 0 CONSTRAINT check_reading_minutes CHECK (book_reading_minutes >= 0),
    additional_comments TEXT,
    status TEXT NOT NULL CONSTRAINT check_report_status CHECK (status IN ('completed', 'late', 'missing')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_profile_date_report UNIQUE (profile_id, date)
);

-- Enable RLS on daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- 9. DEVOTIONAL CONTENT
CREATE TABLE IF NOT EXISTS public.devotional_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    transliteration TEXT,
    original_text TEXT,
    translation TEXT,
    audio_url TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on devotional_content
ALTER TABLE public.devotional_content ENABLE ROW LEVEL SECURITY;

-- 10. BOOK REFERENCES
CREATE TABLE IF NOT EXISTS public.book_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_title TEXT NOT NULL UNIQUE,
    chapter_section TEXT,
    url TEXT,
    description TEXT,
    related_lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on book_references
ALTER TABLE public.book_references ENABLE ROW LEVEL SECURITY;

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- RLS FUNCTIONS & HELPERS
-- ==========================================

-- Function to check if user is admin or guru (Runs with SECURITY DEFINER to bypass RLS, avoiding infinite recursion)
CREATE OR REPLACE FUNCTION public.check_user_is_admin_or_guru(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'guru')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- ROW LEVEL SECURITY POLICIES (IDEMPOTENT)
-- ==========================================

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles can be read by owner or Admin/Guru" ON public.profiles;
CREATE POLICY "Profiles can be read by owner or Admin/Guru" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Profiles can be updated by owner or Admin/Guru" ON public.profiles;
CREATE POLICY "Profiles can be updated by owner or Admin/Guru" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Profiles can be managed by Admin/Guru" ON public.profiles;
CREATE POLICY "Profiles can be managed by Admin/Guru" ON public.profiles
    FOR ALL USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 2. Schedule Configs Policies
DROP POLICY IF EXISTS "Schedule configs are readable by anyone" ON public.schedule_configs;
CREATE POLICY "Schedule configs are readable by anyone" ON public.schedule_configs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Schedule configs can be managed by Admin/Guru" ON public.schedule_configs;
CREATE POLICY "Schedule configs can be managed by Admin/Guru" ON public.schedule_configs
    FOR ALL USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 3. Attendance Policies
DROP POLICY IF EXISTS "Attendance can be read by owner or Admin/Guru" ON public.attendance;
CREATE POLICY "Attendance can be read by owner or Admin/Guru" ON public.attendance
    FOR SELECT USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Attendance can be inserted by owner or Admin/Guru" ON public.attendance;
CREATE POLICY "Attendance can be inserted by owner or Admin/Guru" ON public.attendance
    FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Attendance can be updated by owner or Admin/Guru" ON public.attendance;
CREATE POLICY "Attendance can be updated by owner or Admin/Guru" ON public.attendance
    FOR UPDATE USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Attendance can be deleted by Admin/Guru" ON public.attendance;
CREATE POLICY "Attendance can be deleted by Admin/Guru" ON public.attendance
    FOR DELETE USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 4. Lectures Policies
DROP POLICY IF EXISTS "Lectures are readable by anyone" ON public.lectures;
CREATE POLICY "Lectures are readable by anyone" ON public.lectures
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectures can be managed by Admin/Guru" ON public.lectures;
CREATE POLICY "Lectures can be managed by Admin/Guru" ON public.lectures
    FOR ALL USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 5. Lecture Attendance Policies
DROP POLICY IF EXISTS "Lecture attendance can be read by owner or Admin/Guru" ON public.lecture_attendance;
CREATE POLICY "Lecture attendance can be read by owner or Admin/Guru" ON public.lecture_attendance
    FOR SELECT USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Lecture attendance can be inserted by owner or Admin/Guru" ON public.lecture_attendance;
CREATE POLICY "Lecture attendance can be inserted by owner or Admin/Guru" ON public.lecture_attendance
    FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Lecture attendance can be updated by owner or Admin/Guru" ON public.lecture_attendance;
CREATE POLICY "Lecture attendance can be updated by owner or Admin/Guru" ON public.lecture_attendance
    FOR UPDATE USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Lecture attendance can be deleted by Admin/Guru" ON public.lecture_attendance;
CREATE POLICY "Lecture attendance can be deleted by Admin/Guru" ON public.lecture_attendance
    FOR DELETE USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 6. Contemplations Policies
DROP POLICY IF EXISTS "Contemplations can be read by owner or Admin/Guru" ON public.contemplations;
CREATE POLICY "Contemplations can be read by owner or Admin/Guru" ON public.contemplations
    FOR SELECT USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Contemplations can be inserted by owner or Admin/Guru" ON public.contemplations;
CREATE POLICY "Contemplations can be inserted by owner or Admin/Guru" ON public.contemplations
    FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Contemplations can be updated by owner or Admin/Guru" ON public.contemplations;
CREATE POLICY "Contemplations can be updated by owner or Admin/Guru" ON public.contemplations
    FOR UPDATE USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Contemplations can be deleted by Admin/Guru" ON public.contemplations;
CREATE POLICY "Contemplations can be deleted by Admin/Guru" ON public.contemplations
    FOR DELETE USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 7. Mala Records Policies
DROP POLICY IF EXISTS "Mala records can be read by owner or Admin/Guru" ON public.mala_records;
CREATE POLICY "Mala records can be read by owner or Admin/Guru" ON public.mala_records
    FOR SELECT USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Mala records can be inserted by owner or Admin/Guru" ON public.mala_records;
CREATE POLICY "Mala records can be inserted by owner or Admin/Guru" ON public.mala_records
    FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Mala records can be updated by owner or Admin/Guru" ON public.mala_records;
CREATE POLICY "Mala records can be updated by owner or Admin/Guru" ON public.mala_records
    FOR UPDATE USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Mala records can be deleted by Admin/Guru" ON public.mala_records;
CREATE POLICY "Mala records can be deleted by Admin/Guru" ON public.mala_records
    FOR DELETE USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 8. Daily Reports Policies
DROP POLICY IF EXISTS "Daily reports can be read by owner or Admin/Guru" ON public.daily_reports;
CREATE POLICY "Daily reports can be read by owner or Admin/Guru" ON public.daily_reports
    FOR SELECT USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Daily reports can be inserted by owner or Admin/Guru" ON public.daily_reports;
CREATE POLICY "Daily reports can be inserted by owner or Admin/Guru" ON public.daily_reports
    FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Daily reports can be updated by owner or Admin/Guru" ON public.daily_reports;
CREATE POLICY "Daily reports can be updated by owner or Admin/Guru" ON public.daily_reports
    FOR UPDATE USING (auth.uid() = profile_id OR public.check_user_is_admin_or_guru(auth.uid()));

DROP POLICY IF EXISTS "Daily reports can be deleted by Admin/Guru" ON public.daily_reports;
CREATE POLICY "Daily reports can be deleted by Admin/Guru" ON public.daily_reports
    FOR DELETE USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 9. Devotional Content Policies
DROP POLICY IF EXISTS "Devotional content is readable by anyone" ON public.devotional_content;
CREATE POLICY "Devotional content is readable by anyone" ON public.devotional_content
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Devotional content can be managed by Admin/Guru" ON public.devotional_content;
CREATE POLICY "Devotional content can be managed by Admin/Guru" ON public.devotional_content
    FOR ALL USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 10. Book References Policies
DROP POLICY IF EXISTS "Book references are readable by anyone" ON public.book_references;
CREATE POLICY "Book references are readable by anyone" ON public.book_references
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Book references can be managed by Admin/Guru" ON public.book_references;
CREATE POLICY "Book references can be managed by Admin/Guru" ON public.book_references
    FOR ALL USING (public.check_user_is_admin_or_guru(auth.uid()));


-- 11. Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs can be read by Admin/Guru" ON public.audit_logs;
CREATE POLICY "Audit logs can be read by Admin/Guru" ON public.audit_logs
    FOR SELECT USING (public.check_user_is_admin_or_guru(auth.uid()));

-- Only database service role or triggers can insert audit logs; direct user insertions are blocked


-- ==========================================
-- SIGNUP TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, prescribed_mala)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        'pending_devotee',
        16
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution (idempotent setup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- UPDATE TRIGGER FOR PROFILES MODIFICATION PROTECTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS trigger AS $$
BEGIN
    -- If role or prescribed_mala is modified, check if current actor is Admin/Guru
    -- auth.uid() returns NULL when run via internal triggers or seeds, so allow it if auth.uid() is null
    IF auth.uid() IS NOT NULL THEN
        IF NOT public.check_user_is_admin_or_guru(auth.uid()) THEN
            -- Non-admin/guru trying to modify role or prescribed_mala
            IF NEW.role IS DISTINCT FROM OLD.role THEN
                NEW.role := OLD.role;
            END IF;
            IF NEW.prescribed_mala IS DISTINCT FROM OLD.prescribed_mala THEN
                NEW.prescribed_mala := OLD.prescribed_mala;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_tampering();

-- Deduplicate devotional_content before adding unique constraint
DELETE FROM public.devotional_content a
USING public.devotional_content b
WHERE a.id > b.id AND a.title = b.title;

-- Add unique constraint on title for devotional_content
ALTER TABLE public.devotional_content DROP CONSTRAINT IF EXISTS unique_devotional_title;
ALTER TABLE public.devotional_content ADD CONSTRAINT unique_devotional_title UNIQUE (title);

-- Deduplicate lectures before adding unique constraint
DELETE FROM public.lectures a
USING public.lectures b
WHERE a.id > b.id AND a.youtube_video_id = b.youtube_video_id;

-- Add unique constraint on youtube_video_id for lectures
ALTER TABLE public.lectures DROP CONSTRAINT IF EXISTS unique_youtube_video_id;
ALTER TABLE public.lectures ADD CONSTRAINT unique_youtube_video_id UNIQUE (youtube_video_id);

-- Add type, associated_program, and approved fields to devotional_content
ALTER TABLE public.devotional_content ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Prayer';
ALTER TABLE public.devotional_content ADD COLUMN IF NOT EXISTS associated_program TEXT;
ALTER TABLE public.devotional_content ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;

-- Add source_channel, video_url, and approval_status fields to lectures
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'Golok Vrindavan Das';
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- Deduplicate book_references before adding unique constraint
DELETE FROM public.book_references a
USING public.book_references b
WHERE a.id > b.id AND a.book_title = b.book_title;

-- Add unique constraint on book_title for book_references
ALTER TABLE public.book_references DROP CONSTRAINT IF EXISTS unique_book_title;
ALTER TABLE public.book_references ADD CONSTRAINT unique_book_title UNIQUE (book_title);

-- Deduplicate schedule_configs before adding unique constraint
DELETE FROM public.schedule_configs a
USING public.schedule_configs b
WHERE a.id > b.id AND a.title = b.title;

-- Add unique constraint on title for schedule_configs
ALTER TABLE public.schedule_configs DROP CONSTRAINT IF EXISTS unique_schedule_title;
ALTER TABLE public.schedule_configs ADD CONSTRAINT unique_schedule_title UNIQUE (title);
