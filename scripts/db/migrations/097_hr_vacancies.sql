-- Migration 097: HR vacancies — job postings, applications, audit events
-- SSOT statuses: src/config/hr-vacancies.ts, src/config/hr-application-status.ts

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  summary TEXT,
  description TEXT NOT NULL,
  role_track VARCHAR(30) NOT NULL,
  department VARCHAR(50),
  location VARCHAR(200),
  remote_ok BOOLEAN NOT NULL DEFAULT false,
  hours_per_week INTEGER,
  start_date DATE,
  application_deadline TIMESTAMPTZ,
  compensation_public_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  frozen_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  hiring_manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  show_on_get_involved BOOLEAN NOT NULL DEFAULT true,
  seo_title VARCHAR(200),
  seo_description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_postings_role_track_valid CHECK (
    role_track IN ('volunteer', 'intern', 'employee', 'reintegration', 'contractor')
  ),
  CONSTRAINT job_postings_status_valid CHECK (
    status IN ('draft', 'published', 'frozen', 'filled', 'closed', 'archived')
  )
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_role_track ON job_postings(role_track);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_published_at ON job_postings(published_at DESC);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(320) NOT NULL,
  applicant_phone VARCHAR(50),
  locale VARCHAR(10) DEFAULT 'de',
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  track_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  cv_storage_key TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(30) NOT NULL DEFAULT 'website',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  withdrawn_at TIMESTAMPTZ,
  hired_team_profile_id UUID REFERENCES team_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_applications_status_valid CHECK (
    status IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')
  ),
  CONSTRAINT job_applications_source_valid CHECK (
    source IN ('website', 'referral', 'get_involved', 'other')
  )
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON job_applications(created_at DESC);

CREATE TABLE IF NOT EXISTS job_application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_application_events_app ON job_application_events(application_id, created_at DESC);

-- About-page leadership flag (phase 4)
ALTER TABLE team_profiles
  ADD COLUMN IF NOT EXISTS show_on_about BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_team_profiles_show_on_about ON team_profiles(show_on_about) WHERE show_on_about = true;
