-- Migration 109: baseline the remaining push-only tables
--
-- Same disease as `reviews` (fixed by 101b): these ten tables were created on
-- prod via ad-hoc `drizzle-kit push` and exist in NO migration, so from-scratch
-- replays (CI Migration Drift, fresh installs, the CI E2E environment) are
-- missing them. Two are actively written on prod (`user_lockouts` by the auth
-- rate-limiter, `activity_feed` by logActivity). DDL is the exact prod state
-- (pg_dump --schema-only, 2026-07-03). Fully idempotent — a no-op on prod.
--
-- Policy from here on (CLAUDE.md): schema reaches ANY shared database only via
-- scripts/db/migrations/. drizzle-kit push is forbidden.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── auth: lockouts + audit ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_lockouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ip_address character varying(45),
    failed_attempts integer DEFAULT 0 NOT NULL,
    lockout_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_attempt timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_lockouts_pkey PRIMARY KEY (id),
    CONSTRAINT user_lockouts_user_id_unique UNIQUE (user_id),
    CONSTRAINT user_lockouts_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lockouts_locked_until ON user_lockouts (locked_until);
CREATE INDEX IF NOT EXISTS idx_lockouts_user_id ON user_lockouts (user_id);

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(50) NOT NULL,
    user_id uuid,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    details jsonb DEFAULT '{}'::jsonb,
    severity character varying(20) DEFAULT 'info'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT auth_audit_log_pkey PRIMARY KEY (id),
    CONSTRAINT auth_audit_log_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON auth_audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON auth_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address ON auth_audit_log (ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON auth_audit_log (severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_event ON auth_audit_log (user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log (user_id);

-- ── reviews subsystem (parent `reviews` baselined by 101b) ──────────────────

CREATE TABLE IF NOT EXISTS review_attachments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    filename character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size_bytes integer,
    mime_type character varying(100),
    attachment_type character varying(20) DEFAULT 'image'::character varying,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_attachments_pkey PRIMARY KEY (id),
    CONSTRAINT review_attachments_attachment_type_check
        CHECK (attachment_type::text = ANY (ARRAY[('image'::character varying)::text, ('video'::character varying)::text, ('document'::character varying)::text])),
    CONSTRAINT review_attachments_review_id_fkey
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_attachments_review_id ON review_attachments (review_id);

CREATE TABLE IF NOT EXISTS review_responses (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    responder_id uuid NOT NULL,
    content text NOT NULL,
    status character varying(20) DEFAULT 'published'::character varying NOT NULL,
    moderation_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_responses_pkey PRIMARY KEY (id),
    CONSTRAINT review_responses_review_id_key UNIQUE (review_id),
    CONSTRAINT review_responses_status_check
        CHECK (status::text = ANY (ARRAY[('published'::character varying)::text, ('pending_moderation'::character varying)::text, ('hidden'::character varying)::text])),
    CONSTRAINT review_responses_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES users(id),
    CONSTRAINT review_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT review_responses_review_id_fkey FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_responses_responder_id ON review_responses (responder_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses (review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_status ON review_responses (status);

CREATE TABLE IF NOT EXISTS review_votes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    voter_id uuid NOT NULL,
    vote_type character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_votes_pkey PRIMARY KEY (id),
    CONSTRAINT review_votes_review_id_voter_id_key UNIQUE (review_id, voter_id),
    CONSTRAINT review_votes_vote_type_check
        CHECK (vote_type::text = ANY (ARRAY[('helpful'::character varying)::text, ('unhelpful'::character varying)::text])),
    CONSTRAINT review_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT review_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes (review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_voter_id ON review_votes (voter_id);

CREATE TABLE IF NOT EXISTS review_moderation_log (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    review_id uuid,
    response_id uuid,
    action character varying(50) NOT NULL,
    reason text,
    admin_id uuid NOT NULL,
    old_status character varying(20),
    new_status character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_moderation_log_pkey PRIMARY KEY (id),
    CONSTRAINT review_moderation_log_action_check
        CHECK (action::text = ANY (ARRAY[('approve'::character varying)::text, ('hide'::character varying)::text, ('delete'::character varying)::text, ('restore'::character varying)::text, ('flag_spam'::character varying)::text, ('flag_inappropriate'::character varying)::text])),
    CONSTRAINT review_moderation_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users(id),
    CONSTRAINT review_moderation_log_response_id_fkey FOREIGN KEY (response_id) REFERENCES review_responses(id) ON DELETE SET NULL,
    CONSTRAINT review_moderation_log_review_id_fkey FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_review_moderation_log_admin_id ON review_moderation_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_log_review_id ON review_moderation_log (review_id);

-- ── locations: approvals audit + bookings ────────────────────────────────────

CREATE TABLE IF NOT EXISTS location_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    review_notes text,
    required_changes text[],
    reviewed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT location_approvals_pkey PRIMARY KEY (id),
    CONSTRAINT location_approvals_location_id_locations_id_fk
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    CONSTRAINT location_approvals_reviewer_id_users_id_fk
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Migration 085 defines prevent_location_approval_update() unconditionally but
-- guards the trigger on table existence — on a fresh replay 085 ran before this
-- table existed, so attach the immutability trigger here.
DO $$
BEGIN
  IF to_regproc('prevent_location_approval_update') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_prevent_location_approval_update ON location_approvals;
    CREATE TRIGGER trg_prevent_location_approval_update
      BEFORE UPDATE ON location_approvals
      FOR EACH ROW
      EXECUTE FUNCTION prevent_location_approval_update();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS location_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    booked_by uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    event_id uuid,
    title character varying(255) NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    expected_attendees integer,
    special_requirements text,
    status character varying(20) DEFAULT 'confirmed'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT location_bookings_pkey PRIMARY KEY (id),
    CONSTRAINT location_bookings_booked_by_users_id_fk FOREIGN KEY (booked_by) REFERENCES users(id),
    CONSTRAINT location_bookings_location_id_locations_id_fk
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- ── activity feed + cron bookkeeping ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_feed (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid NOT NULL,
    action text NOT NULL,
    subject_type text,
    subject_id text,
    subject_label text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT activity_feed_pkey PRIMARY KEY (id),
    CONSTRAINT activity_feed_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed (created_at DESC);

CREATE TABLE IF NOT EXISTS job_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_name text NOT NULL,
    ran_at timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    detail text,
    CONSTRAINT job_runs_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_job_runs_name_ran_at ON job_runs (job_name, ran_at DESC);
