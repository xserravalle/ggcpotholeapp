-- ==============================================================================
-- SansPotholes Municipal Dispatch & Civic Pothole Management
-- Supabase Schema & Row-Level Security (RLS) Migration
-- Version: 20261030000000
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AGENCIES TABLE
-- Municipal public works agencies and campus infrastructure authorities
CREATE TABLE IF NOT EXISTS public.agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    jurisdiction_scope TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. OFFICERS TABLE (Field Crews & Agency Staff)
-- Active maintenance personnel and field inspectors eligible for job dispatches
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
-- Role mappings defining administrative and agency crew capabilities
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
-- Status CHECK matches src/domain/status.ts exactly ('acknowledged' removed)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    tracking_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (
        status IN ('reported', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')
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
    reopen_count INTEGER DEFAULT 0 NOT NULL,
    user_confirmed BOOLEAN DEFAULT TRUE NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TIMELINE ENTRIES TABLE (Immutable Civic Audit Trail)
-- Append-only timeline entries managed strictly via SECURITY DEFINER RPCs
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

-- ==============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_authority ON public.reports(authority_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_officer ON public.reports(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_email ON public.reports(reporter_email);
CREATE INDEX IF NOT EXISTS idx_timeline_report ON public.timeline_entries(report_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_comments_report ON public.comments(report_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, read);

-- ==============================================================================
-- PUBLIC VIEW: NON-PERSONAL REPORT DATA (Zero PII Exposed to Anonymous/Guest Users)
-- ==============================================================================
-- Excludes reporter_name, reporter_email, and reporter_id to protect citizen privacy.
CREATE OR REPLACE VIEW public.reports_public AS
SELECT 
    id,
    tracking_code,
    title,
    description,
    status,
    severity,
    latitude,
    longitude,
    address,
    road_name,
    city,
    jurisdiction,
    authority_id,
    assigned_agency_id,
    assigned_officer_id,
    assigned_crew,
    image_url,
    after_image_url,
    landmark,
    feedback_rating,
    feedback_comment,
    rejection_reason,
    resolve_notes,
    priority,
    priority_score,
    sla_due_at,
    last_verified_at,
    verifications_count,
    reopen_count,
    user_confirmed,
    reported_at,
    updated_at
FROM public.reports;

-- Grant public read access to the non-PII view
GRANT SELECT ON public.reports_public TO anon, authenticated;

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

-- Fetch agency_id of calling user if assigned to agency crew
CREATE OR REPLACE FUNCTION public.auth_agency_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
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
-- RLS POLICIES
-- ==============================================================================

-- 1. AGENCIES
-- Public read access so commuters can identify jurisdictional authorities
CREATE POLICY "Agencies are readable by everyone"
    ON public.agencies FOR SELECT
    USING (true);

-- Municipal agency directory modifications are restricted exclusively to administrators
CREATE POLICY "Agencies can only be modified by admins"
    ON public.agencies FOR ALL
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- 2. OFFICERS
-- Public read access so work orders display the assigned field inspector/crew
CREATE POLICY "Officers directory is readable by everyone"
    ON public.officers FOR SELECT
    USING (true);

-- Officer provisioning and status updates are restricted exclusively to administrators
CREATE POLICY "Officers can only be modified by admins"
    ON public.officers FOR ALL
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- 3. USER ROLES (Admin-Managed Only, Never Self-Service)
-- Users can see their own active role; Admins can audit all role assignments
CREATE POLICY "Users can view their own role; Admins can view all"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.auth_is_admin());

CREATE POLICY "Only admins can insert user roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Only admins can update user roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

CREATE POLICY "Only admins can delete user roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 4. REPORTS POLICIES
-- SELECT: Direct select on public.reports is restricted to authorized roles:
-- Admins see all rows (including reporter PII);
-- Assigned officers see rows assigned to their officer ID or agency;
-- Authenticated reporters see their own submitted rows.
-- (Public/anonymous queries query public.reports_public view instead).
CREATE POLICY "Admins, assigned officers, and report owners can view full report records"
    ON public.reports FOR SELECT
    TO authenticated
    USING (
        public.auth_is_admin()
        OR (
            assigned_officer_id IS NOT NULL 
            AND assigned_officer_id = public.auth_officer_id()
        )
        OR (
            assigned_agency_id IS NOT NULL 
            AND assigned_agency_id = public.auth_agency_id()
        )
        OR (
            reporter_id = auth.uid()
            OR (reporter_email IS NOT NULL AND reporter_email = (auth.jwt() ->> 'email'))
        )
    );

-- INSERT: Anonymous and guest commuters can insert new pothole reports.
-- Enforces that guest inserts only have status = 'reported', with no assignment,
-- priority, SLA, verification, or resolution fields pre-filled.
CREATE POLICY "Anyone can submit a new reported pothole without assignment or SLA overrides"
    ON public.reports FOR INSERT
    WITH CHECK (
        status = 'reported'
        AND assigned_agency_id IS NULL
        AND assigned_officer_id IS NULL
        AND assigned_crew IS NULL
        AND priority IS NULL
        AND priority_score IS NULL
        AND sla_due_at IS NULL
        AND last_verified_at IS NULL
        AND rejection_reason IS NULL
        AND resolve_notes IS NULL
        AND feedback_rating IS NULL
        AND feedback_comment IS NULL
    );

-- UPDATE: Direct column updates are restricted exclusively to administrators.
-- All other state transitions (verify, assign, start, resolve, rate, reopen)
-- MUST execute through SECURITY DEFINER RPC functions.
CREATE POLICY "Only admins can execute direct column updates on reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (public.auth_is_admin())
    WITH CHECK (public.auth_is_admin());

-- DELETE: Only administrators can permanently delete report records
CREATE POLICY "Only admins can delete reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 5. TIMELINE ENTRIES POLICIES
-- Publicly readable so commuters can follow the public audit trail of repairs
CREATE POLICY "Timeline entries are publicly readable"
    ON public.timeline_entries FOR SELECT
    USING (true);

-- Revoke direct INSERT/UPDATE/DELETE on timeline_entries from clients.
-- All timeline writes are executed atomically inside SECURITY DEFINER RPC functions.
REVOKE INSERT, UPDATE, DELETE ON public.timeline_entries FROM anon, authenticated;

-- 6. COMMENTS POLICIES
CREATE POLICY "Comments are publicly readable"
    ON public.comments FOR SELECT
    USING (true);

-- Anyone can submit comments, with length limit of 1000 characters enforced at the database layer
CREATE POLICY "Anyone can add comments to reports (length <= 1000 enforced)"
    ON public.comments FOR INSERT
    WITH CHECK (LENGTH(text) <= 1000);

CREATE POLICY "Only admins can delete inappropriate comments"
    ON public.comments FOR DELETE
    TO authenticated
    USING (public.auth_is_admin());

-- 7. NOTIFICATIONS POLICIES
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
-- SECURITY DEFINER RPC FUNCTIONS FOR STATE CHANGES
-- Atomically validates caller role, updates report status, and logs timeline entry
-- ==============================================================================

-- 1. VERIFY: Municipal Admin confirms reported pothole
CREATE OR REPLACE FUNCTION public.rpc_verify_report(
    p_report_id TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
BEGIN
    IF NOT public.auth_is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only municipal administrators can verify reports.';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    IF v_report.status <> 'reported' THEN
        RAISE EXCEPTION 'Invalid transition: Report is already %.', v_report.status;
    END IF;

    UPDATE public.reports
    SET status = 'verified',
        last_verified_at = TIMEZONE('utc'::text, NOW()),
        verifications_count = v_report.verifications_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'VERIFY',
        'verified',
        'admin',
        COALESCE(auth.jwt() ->> 'email', 'Municipal Staff'),
        COALESCE(p_notes, 'Pothole verified by transportation staff.')
    );

    RETURN jsonb_build_object('success', true, 'status', 'verified');
END;
$$;

-- 2. ASSIGN: Municipal Admin dispatches report to agency crew
CREATE OR REPLACE FUNCTION public.rpc_assign_report(
    p_report_id TEXT,
    p_agency_id TEXT,
    p_officer_id TEXT DEFAULT NULL,
    p_crew TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium',
    p_sla_due_at TIMESTAMPTZ DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
BEGIN
    IF NOT public.auth_is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only municipal administrators can assign reports.';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    UPDATE public.reports
    SET status = 'assigned',
        assigned_agency_id = p_agency_id,
        assigned_officer_id = p_officer_id,
        assigned_crew = p_crew,
        priority = p_priority,
        sla_due_at = p_sla_due_at,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'ASSIGN',
        'assigned',
        'admin',
        COALESCE(auth.jwt() ->> 'email', 'Municipal Staff'),
        COALESCE(p_notes, 'Assigned to agency maintenance crew.')
    );

    RETURN jsonb_build_object('success', true, 'status', 'assigned');
END;
$$;

-- 3. START WORK: Agency Crew or Admin begins on-site repair
CREATE OR REPLACE FUNCTION public.rpc_start_progress(
    p_report_id TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_officer_id TEXT;
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := public.auth_is_admin();
    v_officer_id := public.auth_officer_id();

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    IF NOT v_is_admin AND (v_report.assigned_officer_id IS NULL OR v_report.assigned_officer_id <> v_officer_id) THEN
        RAISE EXCEPTION 'Access denied: You are not assigned to this repair work order.';
    END IF;

    UPDATE public.reports
    SET status = 'in_progress',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'START_WORK',
        'in_progress',
        CASE WHEN v_is_admin THEN 'admin' ELSE 'officer' END,
        COALESCE(auth.jwt() ->> 'email', 'Field Crew'),
        COALESCE(p_notes, 'Crew dispatched to repair site; work in progress.')
    );

    RETURN jsonb_build_object('success', true, 'status', 'in_progress');
END;
$$;

-- 4. RESOLVE: Agency Crew or Admin completes asphalt patch/repair
CREATE OR REPLACE FUNCTION public.rpc_resolve_report(
    p_report_id TEXT,
    p_resolve_notes TEXT,
    p_after_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_officer_id TEXT;
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := public.auth_is_admin();
    v_officer_id := public.auth_officer_id();

    IF p_resolve_notes IS NULL OR LENGTH(TRIM(p_resolve_notes)) = 0 THEN
        RAISE EXCEPTION 'Resolution note explaining the completed repair is required.';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    IF NOT v_is_admin AND (v_report.assigned_officer_id IS NULL OR v_report.assigned_officer_id <> v_officer_id) THEN
        RAISE EXCEPTION 'Access denied: You are not assigned to resolve this repair work order.';
    END IF;

    UPDATE public.reports
    SET status = 'resolved',
        resolve_notes = p_resolve_notes,
        after_image_url = p_after_image_url,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'RESOLVE',
        'resolved',
        CASE WHEN v_is_admin THEN 'admin' ELSE 'officer' END,
        COALESCE(auth.jwt() ->> 'email', 'Field Crew'),
        p_resolve_notes
    );

    RETURN jsonb_build_object('success', true, 'status', 'resolved');
END;
$$;

-- 5. RATE: Commuter submits feedback on their own resolved report
CREATE OR REPLACE FUNCTION public.rpc_rate_report(
    p_report_id TEXT,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';

    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be an integer between 1 and 5 stars.';
    END IF;

    IF p_comment IS NOT NULL AND LENGTH(p_comment) > 1000 THEN
        RAISE EXCEPTION 'Feedback comment exceeds 1000 character limit.';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    -- Enforce ownership: only the reporter who filed the report can rate it
    IF (v_report.reporter_id IS NULL OR v_report.reporter_id <> v_user_id)
       AND (v_report.reporter_email IS NULL OR v_report.reporter_email <> v_user_email) THEN
        RAISE EXCEPTION 'Access denied: You can only submit feedback on your own report.';
    END IF;

    IF v_report.status NOT IN ('resolved', 'closed') THEN
        RAISE EXCEPTION 'Feedback can only be submitted for resolved or closed repairs.';
    END IF;

    UPDATE public.reports
    SET feedback_rating = p_rating,
        feedback_comment = p_comment,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'CITIZEN_RATING',
        v_report.status,
        'user',
        COALESCE(v_user_email, 'Citizen Commuter'),
        'Citizen feedback: ' || p_rating || ' stars' || CASE WHEN p_comment IS NOT NULL AND LENGTH(p_comment) > 0 THEN ' - "' || p_comment || '"' ELSE '' END
    );

    RETURN jsonb_build_object('success', true, 'rating', p_rating);
END;
$$;

-- 6. REOPEN: Commuter reopens their own resolved report if repair fails
CREATE OR REPLACE FUNCTION public.rpc_reopen_report(
    p_report_id TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_user_id UUID;
    v_user_email TEXT;
    v_is_admin BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';
    v_is_admin := public.auth_is_admin();

    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Reopening note explaining recurrence is required.';
    END IF;

    IF LENGTH(p_reason) > 1000 THEN
        RAISE EXCEPTION 'Reopening note exceeds 1000 character limit.';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report % not found.', p_report_id;
    END IF;

    -- Enforce ownership: only the reporter or an administrator can reopen
    IF NOT v_is_admin 
       AND (v_report.reporter_id IS NULL OR v_report.reporter_id <> v_user_id)
       AND (v_report.reporter_email IS NULL OR v_report.reporter_email <> v_user_email) THEN
        RAISE EXCEPTION 'Access denied: You can only reopen reports that you submitted.';
    END IF;

    IF v_report.status NOT IN ('resolved', 'closed') THEN
        RAISE EXCEPTION 'Only resolved or closed reports can be reopened.';
    END IF;

    UPDATE public.reports
    SET status = 'reported',
        reopen_count = v_report.reopen_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_report_id;

    INSERT INTO public.timeline_entries (
        id, report_id, timestamp, action, status, actor_role, actor_name, message
    ) VALUES (
        'tl-' || uuid_generate_v4(),
        p_report_id,
        TIMEZONE('utc'::text, NOW()),
        'REOPEN',
        'reported',
        CASE WHEN v_is_admin THEN 'admin' ELSE 'user' END,
        COALESCE(v_user_email, 'Citizen Commuter'),
        'Reopened by citizen: ' || p_reason
    );

    RETURN jsonb_build_object('success', true, 'status', 'reported', 'reopen_count', v_report.reopen_count + 1);
END;
$$;

-- Grant execution permissions on all RPC state transition functions
GRANT EXECUTE ON FUNCTION public.rpc_verify_report(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_assign_report(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_start_progress(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_resolve_report(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_rate_report(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_reopen_report(TEXT, TEXT) TO authenticated;

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
