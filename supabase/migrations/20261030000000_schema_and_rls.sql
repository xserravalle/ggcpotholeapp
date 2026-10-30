-- ==============================================================================
-- SansPotholes Municipal Dispatch & Civic Pothole Management
-- Supabase Schema & Row-Level Security (RLS) Migration
-- Version: 20261030000000
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    jurisdiction_scope TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. OFFICERS TABLE (Field Crews & Agency Staff)
CREATE TABLE IF NOT EXISTS public.officers (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. USER ROLES TABLE (Admin-Managed Only, Never Self-Service)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer', 'user')),
    officer_id TEXT REFERENCES public.officers(id) ON DELETE SET NULL,
    agency_id TEXT REFERENCES public.agencies(id) ON DELETE SET NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. REPORTS TABLE (Civic Hazard Lifecycle)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    tracking_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (
        status IN ('reported', 'verified', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')
    ),
    severity TEXT NOT NULL CHECK (
        severity IN ('minor', 'moderate', 'severe', 'critical')
    ),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    road_name TEXT NOT NULL,
    city TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    authority_id TEXT REFERENCES public.agencies(id) ON DELETE SET NULL,
    reporter_name TEXT,
    reporter_email TEXT,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_agency_id TEXT REFERENCES public.agencies(id) ON DELETE SET NULL,
    assigned_officer_id TEXT REFERENCES public.officers(id) ON DELETE SET NULL,
    assigned_crew TEXT,
    image_url TEXT,
    after_image_url TEXT,
    landmark TEXT,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    rejection_reason TEXT,
    resolve_notes TEXT,
    priority TEXT,
    priority_score INTEGER,
    sla_due_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    verifications_count INTEGER DEFAULT 1 NOT NULL,
    user_confirmed BOOLEAN DEFAULT TRUE NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TIMELINE ENTRIES TABLE (Immutable Civic Audit Trail)
CREATE TABLE IF NOT EXISTS public.timeline_entries (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported',
    actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'officer', 'user', 'system')),
    actor_name TEXT NOT NULL,
    actor_id TEXT,
    message TEXT NOT NULL DEFAULT '',
    notes TEXT,
    details JSONB
);

-- 7. COMMENTS TABLE (Max 1000 Chars Enforced)
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('admin', 'officer', 'user', 'guest')),
    text TEXT NOT NULL CHECK (LENGTH(text) <= 1000),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'officer', 'user')),
    recipient_name TEXT,
    recipient_email TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    tracking_code TEXT,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_authority ON public.reports(authority_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_officer ON public.reports(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_report ON public.timeline_entries(report_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_comments_report ON public.comments(report_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, read);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Fetch role of calling user
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Check if calling user is a verified administrator
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Fetch officer_id of calling user if assigned to agency crew
CREATE OR REPLACE FUNCTION public.auth_officer_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT officer_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES (MIRRORING src/domain/permissions.ts)
-- ==============================================================================

-- 1. AGENCIES
CREATE POLICY "Agencies are readable by everyone"
    ON public.agencies FOR SELECT
    USING (true);

CREATE POLICY "Agencies can only be modified by admins"
    ON public.agencies FOR ALL
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- 2. OFFICERS
CREATE POLICY "Officers directory is readable by everyone"
    ON public.officers FOR SELECT
    USING (true);

CREATE POLICY "Officers can only be modified by admins"
    ON public.officers FOR ALL
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- 3. USER ROLES (Admins grant, never self-service)
CREATE POLICY "Users can view their own role; Admins can view all"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.auth_is_admin());

CREATE POLICY "Only admins can insert or update user roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Only admins can modify user roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Only admins can delete user roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 4. REPORTS
-- Anyone can view reports on public dashboard/map
CREATE POLICY "Reports are publicly readable"
    ON public.reports FOR SELECT
    USING (true);

-- Anyone (commuters and guest citizens) can file new pothole reports
CREATE POLICY "Anyone can submit a pothole report"
    ON public.reports FOR INSERT
    WITH CHECK (true);

-- Report Updates: Admins can update any; Officers can update their assignments; Commuters can rate resolved reports
CREATE POLICY "Admins have full update permissions on reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Officers can update reports assigned to their agency crew"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (
        assigned_officer_id IS NOT NULL 
        AND assigned_officer_id = public.auth_officer_id()
    )
    WITH CHECK (
        assigned_officer_id IS NOT NULL 
        AND assigned_officer_id = public.auth_officer_id()
    );

CREATE POLICY "Reporters can submit feedback on their own resolved reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (reporter_id = auth.uid() AND status IN ('resolved', 'closed'))
    WITH CHECK (reporter_id = auth.uid() AND status IN ('resolved', 'closed'));

-- Deletion: Only administrators
CREATE POLICY "Only admins can delete reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 5. TIMELINE ENTRIES
CREATE POLICY "Timeline entries are publicly readable"
    ON public.timeline_entries FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users and workers can insert timeline entries"
    ON public.timeline_entries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only admins can delete timeline entries"
    ON public.timeline_entries FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 6. COMMENTS
CREATE POLICY "Comments are publicly readable"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Anyone can add comments to reports (length <= 1000 enforced)"
    ON public.comments FOR INSERT
    WITH CHECK (LENGTH(text) <= 1000);

CREATE POLICY "Only admins can delete inappropriate comments"
    ON public.comments FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 7. NOTIFICATIONS
CREATE POLICY "Users can only read their own notifications or role inbox"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (
        recipient_user_id = auth.uid() 
        OR recipient_role = public.auth_user_role()
    );

CREATE POLICY "Recipients can mark their notifications as read"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (
        recipient_user_id = auth.uid() 
        OR recipient_role = public.auth_user_role()
    )
    WITH CHECK (
        recipient_user_id = auth.uid() 
        OR recipient_role = public.auth_user_role()
    );

CREATE POLICY "System and users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- ==============================================================================
-- APPLE APP STORE ACCOUNT DELETION REQUIREMENT (Guideline 5.1.1(v))
-- Allows users to permanently wipe their account and personal credentials
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    -- Delete user notifications
    DELETE FROM public.notifications WHERE recipient_user_id = current_user_id;

    -- Dissociate user profile from reports without destroying road safety history
    UPDATE public.reports
    SET reporter_id = NULL,
        reporter_name = 'Deleted Account',
        reporter_email = NULL
    WHERE reporter_id = current_user_id;

    -- Delete user roles
    DELETE FROM public.user_roles WHERE user_id = current_user_id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
