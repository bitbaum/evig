-- Migration: 008_rating_review_system
-- Description: Comprehensive rating and review system for repairers and services

-- ============================================================================
-- RATING AND REVIEW SYSTEM
-- ============================================================================

-- Create reviews table for storing user reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('repairer', 'service', 'workshop')),
    target_id UUID NOT NULL, -- References repairer_profiles(id), services(id), or workshops(id)
    booking_id UUID, -- Optional link to the booking that led to this review
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    helpful_votes INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'published'
        CHECK (status IN ('published', 'pending_moderation', 'hidden', 'deleted')),
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, target_type, target_id, booking_id)
);

-- Create review_responses table for repairer responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published'
        CHECK (status IN ('published', 'pending_moderation', 'hidden')),
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id) -- One response per review
);

-- Create review_votes table for helpful/unhelpful votes
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, voter_id) -- One vote per user per review
);

-- Create review_attachments table for review images/videos
CREATE TABLE IF NOT EXISTS review_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    attachment_type VARCHAR(20) DEFAULT 'image'
        CHECK (attachment_type IN ('image', 'video', 'document')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create review_moderation_log table for admin moderation actions
CREATE TABLE IF NOT EXISTS review_moderation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    response_id UUID REFERENCES review_responses(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL
        CHECK (action IN ('approve', 'hide', 'delete', 'restore', 'flag_spam', 'flag_inappropriate')),
    reason TEXT,
    admin_id UUID NOT NULL REFERENCES users(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add rating summary fields to repairer_profiles table
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}';
ALTER TABLE repairer_profiles ADD COLUMN IF NOT EXISTS review_summary JSONB DEFAULT '{
  "communication": 0.0,
  "professionalism": 0.0,
  "quality": 0.0,
  "timeliness": 0.0,
  "value": 0.0,
  "last_updated": null
}';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(helpful_votes DESC, total_votes DESC);

CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_responder_id ON review_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_status ON review_responses(status);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_voter_id ON review_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_review_attachments_review_id ON review_attachments(review_id);

CREATE INDEX IF NOT EXISTS idx_review_moderation_log_review_id ON review_moderation_log(review_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_log_admin_id ON review_moderation_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_repairer_profiles_rating ON repairer_profiles(average_rating DESC, total_reviews DESC);

-- ============================================================================
-- FUNCTIONS FOR RATING CALCULATIONS
-- ============================================================================

-- Function to update repairer rating summary
CREATE OR REPLACE FUNCTION update_repairer_rating_summary(repairer_profile_id UUID)
RETURNS VOID AS $$
DECLARE
    review_stats RECORD;
    rating_dist INTEGER[];
    review_summary_data JSONB;
BEGIN
    -- Calculate rating statistics
    SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(overall_rating)::numeric, 2) as avg_rating,
        ROUND(AVG(NULLIF(communication_rating, 0))::numeric, 2) as avg_communication,
        ROUND(AVG(NULLIF(professionalism_rating, 0))::numeric, 2) as avg_professionalism,
        ROUND(AVG(NULLIF(quality_rating, 0))::numeric, 2) as avg_quality,
        ROUND(AVG(NULLIF(timeliness_rating, 0))::numeric, 2) as avg_timeliness,
        ROUND(AVG(NULLIF(value_rating, 0))::numeric, 2) as avg_value,
        COUNT(*) FILTER (WHERE overall_rating = 1) as rating_1,
        COUNT(*) FILTER (WHERE overall_rating = 2) as rating_2,
        COUNT(*) FILTER (WHERE overall_rating = 3) as rating_3,
        COUNT(*) FILTER (WHERE overall_rating = 4) as rating_4,
        COUNT(*) FILTER (WHERE overall_rating = 5) as rating_5
    INTO review_stats
    FROM reviews
    WHERE target_type = 'repairer'
      AND target_id = repairer_profile_id
      AND status = 'published';

    -- Create rating distribution JSON
    rating_dist := ARRAY[review_stats.rating_1, review_stats.rating_2, review_stats.rating_3, review_stats.rating_4, review_stats.rating_5];

    -- Create review summary JSON
    review_summary_data := jsonb_build_object(
        'communication', COALESCE(review_stats.avg_communication, 0.0),
        'professionalism', COALESCE(review_stats.avg_professionalism, 0.0),
        'quality', COALESCE(review_stats.avg_quality, 0.0),
        'timeliness', COALESCE(review_stats.avg_timeliness, 0.0),
        'value', COALESCE(review_stats.avg_value, 0.0),
        'last_updated', CURRENT_TIMESTAMP
    );

    -- Update repairer profile
    UPDATE repairer_profiles
    SET
        average_rating = COALESCE(review_stats.avg_rating, 0.00),
        total_reviews = review_stats.total_reviews,
        rating_distribution = jsonb_build_object(
            '1', rating_dist[1],
            '2', rating_dist[2],
            '3', rating_dist[3],
            '4', rating_dist[4],
            '5', rating_dist[5]
        ),
        review_summary = review_summary_data,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = repairer_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC RATING UPDATES
-- ============================================================================

-- Trigger function to update ratings when reviews are inserted/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_repairer_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        -- Only update if the review is for a repairer and published
        IF NEW.target_type = 'repairer' AND NEW.status = 'published' THEN
            PERFORM update_repairer_rating_summary(NEW.target_id);
        END IF;

        -- If this was an update and status changed from/to published, update old target too
        IF TG_OP = 'UPDATE' AND OLD.target_type = 'repairer' AND
           ((OLD.status != 'published' AND NEW.status = 'published') OR
            (OLD.status = 'published' AND NEW.status != 'published')) THEN
            PERFORM update_repairer_rating_summary(OLD.target_id);
        END IF;

        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.target_type = 'repairer' AND OLD.status = 'published' THEN
        PERFORM update_repairer_rating_summary(OLD.target_id);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS trigger_reviews_update_ratings ON reviews;
CREATE TRIGGER trigger_reviews_update_ratings
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_update_repairer_ratings();

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Insert sample review data for testing (optional - remove in production)
-- This would typically be handled by the application, not in migration

-- Update existing repairer profiles to have initial rating summaries
DO $$
DECLARE
    repairer_record RECORD;
BEGIN
    FOR repairer_record IN SELECT id FROM repairer_profiles LOOP
        PERFORM update_repairer_rating_summary(repairer_record.id);
    END LOOP;
END $$;