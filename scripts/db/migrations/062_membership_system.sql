-- Membership system for Swiss Verein governance

-- Add membership fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'regular' CHECK (member_type IN ('regular', 'reduced', 'honorary'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_paid_until TIMESTAMP WITH TIME ZONE;

-- Membership applications table
CREATE TABLE IF NOT EXISTS membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  birth_date DATE,
  member_type TEXT DEFAULT 'regular' CHECK (member_type IN ('regular', 'reduced')),
  motivation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_applications_user_id ON membership_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_users_is_member ON users(is_member) WHERE is_member = true;
