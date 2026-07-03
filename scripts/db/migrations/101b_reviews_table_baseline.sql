-- Migration 101b: baseline for the `reviews` table
--
-- `reviews` was created on prod outside the numbered migrations (Drizzle
-- push), so a from-scratch replay (CI Migration Drift Check) died at
-- 102_unify_technician_reviews.sql with `relation "reviews" does not exist`.
-- This baseline recreates the table exactly as it exists on prod
-- (pg_dump --schema-only, 2026-07-03). Fully idempotent: IF NOT EXISTS
-- everywhere, so on prod (where the table already exists) it is a no-op.
--
-- Numbered 101b so it sorts BEFORE 102 in the replay order.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reviews (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    reviewer_id uuid NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    booking_id uuid,
    overall_rating integer NOT NULL,
    communication_rating integer,
    professionalism_rating integer,
    quality_rating integer,
    timeliness_rating integer,
    value_rating integer,
    title character varying(200),
    content text NOT NULL,
    is_verified_purchase boolean DEFAULT false NOT NULL,
    helpful_votes integer DEFAULT 0 NOT NULL,
    total_votes integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'published'::character varying NOT NULL,
    moderation_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_reviewer_id_target_type_target_id_booking_id_key
        UNIQUE (reviewer_id, target_type, target_id, booking_id),
    CONSTRAINT reviews_communication_rating_check CHECK (communication_rating >= 1 AND communication_rating <= 5),
    CONSTRAINT reviews_overall_rating_check CHECK (overall_rating >= 1 AND overall_rating <= 5),
    CONSTRAINT reviews_professionalism_rating_check CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    CONSTRAINT reviews_quality_rating_check CHECK (quality_rating >= 1 AND quality_rating <= 5),
    CONSTRAINT reviews_timeliness_rating_check CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    CONSTRAINT reviews_value_rating_check CHECK (value_rating >= 1 AND value_rating <= 5),
    CONSTRAINT reviews_status_check CHECK (status::text = ANY (ARRAY[
        ('published'::character varying)::text,
        ('pending_moderation'::character varying)::text,
        ('hidden'::character varying)::text,
        ('deleted'::character varying)::text
    ])),
    CONSTRAINT reviews_target_type_check CHECK (target_type::text = ANY (ARRAY[
        ('repairer'::character varying)::text,
        ('service'::character varying)::text,
        ('workshop'::character varying)::text,
        ('it_hilfe'::character varying)::text,
        ('listing'::character varying)::text
    ])),
    CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT reviews_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews (helpful_votes DESC, total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews (target_type, target_id);

-- The rating-aggregate trigger function also lives outside the migrations
-- (same Drizzle-push origin). Attach the trigger only when the function
-- exists — on a fresh replay without it, the table alone is enough for the
-- later migrations (102 recomputes aggregates itself).
DO $$
BEGIN
    IF to_regproc('trigger_update_repairer_ratings') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_trigger
           WHERE tgname = 'trigger_reviews_update_ratings'
             AND tgrelid = 'reviews'::regclass
       ) THEN
        CREATE TRIGGER trigger_reviews_update_ratings
            AFTER INSERT OR DELETE OR UPDATE ON reviews
            FOR EACH ROW EXECUTE FUNCTION trigger_update_repairer_ratings();
    END IF;
END $$;
