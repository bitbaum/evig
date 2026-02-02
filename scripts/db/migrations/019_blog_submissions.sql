-- Blog Submissions Table
-- Stores user-submitted blog content for admin review and approval
-- Part of the unified blog workflow (SSOT)

CREATE TABLE IF NOT EXISTS blog_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitter info (allows anonymous submissions)
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: linked user if logged in

  -- Content
  title TEXT NOT NULL,
  slug TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  submission_type TEXT NOT NULL DEFAULT 'draft' CHECK (submission_type IN ('idea', 'draft')),

  -- Categorization
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  category_name TEXT, -- Fallback if category doesn't exist
  tags TEXT[] DEFAULT '{}',

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),

  -- Review info
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Link to published post (when approved and converted)
  published_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON blog_submissions(status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_submitted_at ON blog_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_submitter_email ON blog_submissions(submitter_email);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_blog_submissions_updated_at
  BEFORE UPDATE ON blog_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE blog_submissions IS 'User-submitted blog content pending admin review';
