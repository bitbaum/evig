CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "auth_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"user_id" uuid,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lockouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"lockout_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_attempt" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lockouts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"company_name" text,
	"phone" text,
	"mobile" text,
	"address_line1" text,
	"address_line2" text,
	"postal_code" text,
	"city" text,
	"canton" text,
	"country" text DEFAULT 'Schweiz',
	"interests" text[],
	"preferred_language" text DEFAULT 'de',
	"newsletter_subscribed" boolean DEFAULT false,
	"newsletter_frequency" text DEFAULT 'monthly',
	"is_supporter" boolean DEFAULT false,
	"supporter_since" timestamp with time zone,
	"supporter_type" text,
	"notes" text,
	"avatar_url" text,
	"display_name" text,
	"bio" text,
	"profile_visibility" text DEFAULT 'public',
	"show_email" boolean DEFAULT false,
	"show_phone" boolean DEFAULT false,
	"email_notifications" boolean DEFAULT true,
	"sms_notifications" boolean DEFAULT false,
	"marketplace_updates" boolean DEFAULT true,
	"workshop_reminders" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"password_hash" text,
	"image" text,
	"role" text DEFAULT 'user',
	"is_staff" boolean DEFAULT false,
	"staff_permissions" text[] DEFAULT '{}',
	"is_super_admin" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#16a34a',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"category_id" uuid,
	"tags" text[] DEFAULT '{}',
	"is_published" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitter_name" text NOT NULL,
	"submitter_email" text NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"slug" text,
	"content" text NOT NULL,
	"excerpt" text,
	"submission_type" text DEFAULT 'draft' NOT NULL,
	"category_id" uuid,
	"category_name" text,
	"tags" text[] DEFAULT '{}',
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"rejection_reason" text,
	"published_post_id" uuid,
	"published_at" timestamp with time zone,
	"edit_history" jsonb DEFAULT '[]'::jsonb,
	"last_edited_by" uuid,
	"last_edited_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "static_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_de" varchar(100) NOT NULL,
	"description" text,
	"description_de" text,
	"icon" text,
	"color" varchar(7),
	"hw_requirement_min" integer DEFAULT 1,
	"hw_requirement_max" integer DEFAULT 3,
	"use_cases" text[] DEFAULT '{}',
	"recommended_os" text[] DEFAULT '{}',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customer_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"suitability_score" integer DEFAULT 80,
	"assigned_by" text DEFAULT 'manual',
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hirn_chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"context_chunks" text[],
	"provider" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hirn_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hirn_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_path" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"indexed_at" timestamp with time zone,
	CONSTRAINT "hirn_documents_source_path_unique" UNIQUE("source_path")
);
--> statement-breakpoint
CREATE TABLE "hirn_provider_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text DEFAULT 'system' NOT NULL,
	"user_id" uuid,
	"provider" text NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"update_type" text DEFAULT 'accomplishment' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"visibility" text DEFAULT 'team' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"requested_user_id" uuid,
	"is_broadcast" boolean GENERATED ALWAYS AS (requested_user_id IS NULL) STORED,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_permission_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_sections" text[] NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"position" text,
	"department" text,
	"employment_type" text DEFAULT 'volunteer',
	"start_date" date,
	"contract_hours" integer,
	"skills" text[] DEFAULT '{}',
	"interests" text[] DEFAULT '{}',
	"goals" text,
	"strengths" text,
	"development_areas" text,
	"availability" text,
	"working_hours" text,
	"preferred_contact" text DEFAULT 'email',
	"phone" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"hr_notes" text,
	"current_focus" text,
	"current_focus_updated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "team_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_content_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid,
	"title" text NOT NULL,
	"summary" text,
	"status" text DEFAULT 'pending',
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_extracted_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_image_url" text,
	"extracted_at" timestamp with time zone DEFAULT now(),
	"product_name" text,
	"product_name_confidence" numeric(3, 2),
	"brand" text,
	"brand_confidence" numeric(3, 2),
	"model" text,
	"model_confidence" numeric(3, 2),
	"category" text,
	"category_confidence" numeric(3, 2),
	"subcategory" text,
	"subcategory_confidence" numeric(3, 2),
	"estimated_price_chf" numeric(10, 2),
	"price_confidence" numeric(3, 2),
	"condition" text,
	"condition_confidence" numeric(3, 2),
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"specs_confidence" numeric(3, 2),
	"color" text,
	"color_confidence" numeric(3, 2),
	"material" text,
	"material_confidence" numeric(3, 2),
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"weight_grams" integer,
	"weight_confidence" numeric(3, 2),
	"ai_provider" text DEFAULT 'openai',
	"ai_model" text DEFAULT 'gpt-4-vision-preview',
	"processing_time_ms" integer,
	"total_confidence" numeric(3, 2),
	"raw_ai_response" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"status" text DEFAULT 'pending_review',
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"kivitendo_article_number" text,
	"medusa_product_id" text,
	"marketplace_listing_id" text,
	"short_description" text,
	"item_uuid" text,
	"source_type" varchar(20) DEFAULT 'erfassung',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_extracted_products_item_uuid_unique" UNIQUE("item_uuid")
);
--> statement-breakpoint
CREATE TABLE "ai_processing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"request_type" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_data" jsonb DEFAULT '{}'::jsonb,
	"response_data" jsonb DEFAULT '{}'::jsonb,
	"processing_time_ms" integer,
	"tokens_used" integer,
	"cost_cents" numeric(8, 4),
	"confidence_score" numeric(3, 2),
	"accuracy_rating" numeric(3, 2),
	"error_message" text,
	"user_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_product_id" uuid,
	"kivitendo_article_number" text,
	"legacy_csv_data" jsonb DEFAULT '{}'::jsonb,
	"location" text,
	"quantity_available" integer DEFAULT 0,
	"quantity_reserved" integer DEFAULT 0,
	"quantity_sold" integer DEFAULT 0,
	"status" text DEFAULT 'available',
	"condition_override" text,
	"condition_notes" text,
	"acquisition_cost_chf" numeric(10, 2),
	"selling_price_chf" numeric(10, 2),
	"min_selling_price_chf" numeric(10, 2),
	"medusa_product_id" text,
	"marketplace_status" text DEFAULT 'draft',
	"medusa_variant_id" text,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"assignment_notes" text,
	"box_id" text,
	"intake_tier" varchar(20),
	"intake_checklist" jsonb DEFAULT '{}'::jsonb,
	"checklist_complete" boolean DEFAULT false,
	"source_donation_id" uuid,
	"intake_events" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "inventory_items_kivitendo_article_number_unique" UNIQUE("kivitendo_article_number"),
	CONSTRAINT "inventory_items_medusa_product_id_unique" UNIQUE("medusa_product_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"price_chf" numeric(10, 2) NOT NULL,
	"platform" text NOT NULL,
	"platform_listing_id" text,
	"platform_url" text,
	"status" text DEFAULT 'draft',
	"is_featured" boolean DEFAULT false,
	"views_count" integer DEFAULT 0,
	"favorites_count" integer DEFAULT 0,
	"sold_at" timestamp with time zone,
	"sold_price_chf" numeric(10, 2),
	"buyer_info" jsonb DEFAULT '{}'::jsonb,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(150),
	"data_type" varchar(20) DEFAULT 'text',
	"unit" varchar(20),
	"is_required" boolean DEFAULT false,
	"is_filterable" boolean DEFAULT false,
	"options" text[] DEFAULT '{}',
	"ai_extraction_prompt" text,
	"ai_confidence_threshold" numeric(3, 2) DEFAULT '0.7',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"level" integer DEFAULT 1,
	"icon" text,
	"color" varchar(7),
	"seo_title" text,
	"seo_description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"ai_detection_keywords" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"filename" text NOT NULL,
	"original_filename" text,
	"file_path" text NOT NULL,
	"file_size_bytes" integer,
	"mime_type" text,
	"ai_description" text,
	"ai_tags" text[],
	"is_primary" boolean DEFAULT false,
	"width" integer,
	"height" integer,
	"dominant_colors" text[],
	"image_quality" numeric(3, 2),
	"upload_status" text DEFAULT 'processing',
	"processed_at" timestamp with time zone,
	"uploaded_by" uuid,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"overall_score" integer,
	"environmental_score" integer,
	"social_score" integer,
	"economic_score" integer,
	"factors" jsonb DEFAULT '{}'::jsonb,
	"ai_analysis" jsonb DEFAULT '{}'::jsonb,
	"ai_provider" text DEFAULT 'openai',
	"ai_model" text,
	"recommendations" text[],
	"improvement_suggestions" text[],
	"assessed_at" timestamp with time zone DEFAULT now(),
	"assessed_by" text DEFAULT 'ai',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listing_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" varchar(50) NOT NULL,
	"details" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"resolution_action" varchar(50),
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "listing_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"spec_key" text NOT NULL,
	"spec_value" text NOT NULL,
	"spec_unit" text,
	"normalized_value" numeric
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price_chf" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"brand" text,
	"model" text,
	"delivery_options" text DEFAULT 'pickup' NOT NULL,
	"shipping_cost_chf" numeric(10, 2),
	"pickup_location" text,
	"payment_mode" text DEFAULT 'direct' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_revampit" boolean DEFAULT false NOT NULL,
	"inventory_item_id" uuid,
	"view_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"verification_notes" text,
	"condition_checks" jsonb,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"amount_chf" numeric(10, 2) NOT NULL,
	"commission_chf" numeric(10, 2) NOT NULL,
	"seller_payout_chf" numeric(10, 2) NOT NULL,
	"stripe_payment_intent_id" text,
	"payrexx_gateway_id" text,
	"payrexx_transaction_id" text,
	"payment_provider" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivery_method" text NOT NULL,
	"tracking_number" text,
	"shipping_address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text,
	"business_type" text NOT NULL,
	"tax_id" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"phone" text NOT NULL,
	"experience" text,
	"product_types" text[] DEFAULT '{}' NOT NULL,
	"motivation" text,
	"terms_accepted" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"review_notes" text,
	"rejection_reason" text,
	"suspension_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seller_applications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text,
	"business_type" text,
	"tax_id" text,
	"address" text,
	"city" text,
	"postal_code" text,
	"phone" text,
	"product_types" text[] DEFAULT '{}',
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp with time zone,
	"total_sales" integer DEFAULT 0,
	"total_revenue_cents" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.0',
	"total_reviews" integer DEFAULT 0,
	"auto_publish" boolean DEFAULT true,
	"notification_preferences" jsonb DEFAULT '{"email":true,"sms":false}'::jsonb,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"canton" text,
	"total_listings" integer DEFAULT 0,
	"total_sold" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seller_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "escrow_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"held_amount_cents" bigint DEFAULT 0 NOT NULL,
	"released_amount_cents" bigint DEFAULT 0 NOT NULL,
	"release_conditions" jsonb DEFAULT '{}'::jsonb,
	"auto_release_days" integer DEFAULT 7,
	"release_deadline" timestamp with time zone,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid,
	"released_at" timestamp with time zone,
	"released_by" uuid,
	"release_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "escrow_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_account_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount_cents" bigint NOT NULL,
	"release_type" varchar(20) NOT NULL,
	"reason" text,
	"released_by" uuid NOT NULL,
	"released_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"service_appointment_id" uuid,
	"workshop_registration_id" uuid,
	"subtotal_cents" bigint DEFAULT 0 NOT NULL,
	"tax_cents" bigint DEFAULT 0 NOT NULL,
	"discount_cents" bigint DEFAULT 0 NOT NULL,
	"total_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0.0770',
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"paid_at" timestamp with time zone,
	"pdf_url" text,
	"pdf_generated_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"email_recipient" varchar(255),
	"notes" text,
	"payment_terms" text DEFAULT 'Payment due within 30 days',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_title" text NOT NULL,
	"product_sku" text,
	"medusa_variant_id" text,
	"inventory_item_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price_cents" bigint NOT NULL,
	"total_price_cents" bigint NOT NULL,
	"product_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"old_status" text,
	"new_status" text NOT NULL,
	"changed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"payment_intent_id" text,
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"subtotal_cents" bigint DEFAULT 0 NOT NULL,
	"tax_cents" bigint DEFAULT 0 NOT NULL,
	"shipping_cents" bigint DEFAULT 0 NOT NULL,
	"discount_cents" bigint DEFAULT 0 NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"shipping_address" jsonb,
	"shipping_method" text,
	"tracking_number" text,
	"estimated_delivery" date,
	"seller_id" uuid,
	"medusa_order_id" text,
	"medusa_cart_id" text,
	"customer_notes" text,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"provider_id" uuid,
	"total_transactions" integer DEFAULT 0,
	"total_volume_cents" bigint DEFAULT 0,
	"total_fees_cents" bigint DEFAULT 0,
	"total_refunds_cents" bigint DEFAULT 0,
	"currency_totals" jsonb DEFAULT '{}'::jsonb,
	"status_breakdown" jsonb DEFAULT '{}'::jsonb,
	"type_breakdown" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_number" varchar(50) NOT NULL,
	"transaction_id" uuid NOT NULL,
	"provider_dispute_id" varchar(255),
	"amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"reason" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'opened' NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"response" text,
	"response_deadline" timestamp with time zone,
	"resolution" varchar(20),
	"resolution_amount_cents" bigint,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"refund_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payment_disputes_dispute_number_unique" UNIQUE("dispute_number")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"provider_payment_method_id" varchar(255) NOT NULL,
	"last_four" varchar(4),
	"expiry_month" integer,
	"expiry_year" integer,
	"card_brand" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"supported_currencies" text[] DEFAULT '{"CHF","EUR"}',
	"test_mode" boolean DEFAULT true NOT NULL,
	"fee_percentage" numeric(5, 4) DEFAULT '0.0000',
	"fee_fixed_cents" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payment_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_transaction_id" varchar(255),
	"type" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"fee_cents" bigint DEFAULT 0,
	"net_amount_cents" bigint DEFAULT 0,
	"order_id" uuid,
	"service_appointment_id" uuid,
	"workshop_registration_id" uuid,
	"payment_method_id" uuid,
	"escrow_release_date" timestamp with time zone,
	"escrow_released" boolean DEFAULT false NOT NULL,
	"escrow_release_reason" text,
	"provider_response" jsonb DEFAULT '{}'::jsonb,
	"failure_reason" text,
	"description" text,
	"internal_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payment_transactions_provider_transaction_id_unique" UNIQUE("provider_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_number" varchar(50) NOT NULL,
	"original_transaction_id" uuid NOT NULL,
	"refund_transaction_id" uuid,
	"amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"reason" varchar(50) NOT NULL,
	"reason_details" text,
	"status" varchar(20) DEFAULT 'requested' NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"processed_by" uuid,
	"invoice_id" uuid,
	"requested_at" timestamp with time zone DEFAULT now(),
	"approved_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"internal_notes" text,
	"customer_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "refunds_refund_number_unique" UNIQUE("refund_number")
);
--> statement-breakpoint
CREATE TABLE "repairer_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text,
	"business_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"years_experience" integer DEFAULT 0,
	"phone" varchar(50) NOT NULL,
	"website" varchar(255),
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"service_radius_km" integer DEFAULT 50,
	"remote_services" boolean DEFAULT false NOT NULL,
	"hourly_rate_cents" integer,
	"emergency_fee_cents" integer,
	"home_visit_fee_cents" integer,
	"services_offered" text[] DEFAULT '{}',
	"specializations" text[] DEFAULT '{}',
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"insurance_info" text,
	"portfolio_images" text[] DEFAULT '{}',
	"verification_documents" text[] DEFAULT '{}',
	"terms_accepted" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "repairer_applications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "repairer_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repairer_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"duration_hours" numeric(4, 1),
	"availability_type" text DEFAULT 'available',
	"booking_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repairer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text,
	"business_type" text DEFAULT 'individual' NOT NULL,
	"description" text,
	"years_experience" integer DEFAULT 0,
	"phone" text NOT NULL,
	"website" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"services_offered" text[] DEFAULT '{}' NOT NULL,
	"specializations" text[] DEFAULT '{}',
	"certifications" text[] DEFAULT '{}',
	"service_radius_km" integer DEFAULT 50,
	"remote_services" boolean DEFAULT false,
	"hourly_rate_cents" integer,
	"emergency_fee_cents" integer,
	"home_visit_fee_cents" integer,
	"availability_schedule" jsonb DEFAULT '{}'::jsonb,
	"response_time_hours" integer DEFAULT 24,
	"typical_turnaround_days" integer DEFAULT 3,
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp with time zone,
	"verification_documents" text[] DEFAULT '{}',
	"total_jobs_completed" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.0',
	"total_reviews" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT '0.0',
	"is_active" boolean DEFAULT true,
	"status" text DEFAULT 'pending_review',
	"portfolio_images" text[] DEFAULT '{}',
	"insurance_info" text,
	"warranty_offered" boolean DEFAULT false,
	"warranty_duration_months" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "repairer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "repairer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repairer_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"pros" text[],
	"cons" text[],
	"timeliness_rating" integer,
	"quality_rating" integer,
	"communication_rating" integer,
	"repairer_response" text,
	"repairer_response_date" timestamp with time zone,
	"is_verified" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repairer_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repairer_id" uuid NOT NULL,
	"service_category" text NOT NULL,
	"service_name" text NOT NULL,
	"description" text,
	"base_price_cents" integer,
	"hourly_rate_cents" integer,
	"parts_included" boolean DEFAULT false,
	"estimated_hours" numeric(4, 1),
	"estimated_days" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"preferred_date" timestamp with time zone,
	"confirmed_date" timestamp with time zone,
	"description" text,
	"device_info" text,
	"urgency" text DEFAULT 'normal',
	"status" text DEFAULT 'requested',
	"outcome_notes" text,
	"price_charged_cents" integer,
	"repairer_id" uuid,
	"repairer_profile_id" uuid,
	"estimated_duration_hours" numeric(5, 2),
	"quoted_price_chf" numeric(10, 2),
	"quote_approved" boolean DEFAULT false,
	"quote_approved_at" timestamp with time zone,
	"diagnosis_notes" text,
	"parts_needed" text[],
	"parts_ordered_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completion_notes" text,
	"customer_rating" integer,
	"customer_review" text,
	"reviewed_at" timestamp with time zone,
	"last_contact_at" timestamp with time zone,
	"messages_count" integer DEFAULT 0,
	"is_home_visit" boolean DEFAULT false,
	"visit_address" text,
	"visit_postal_code" text,
	"visit_city" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 60,
	"price_cents" integer,
	"requires_approval" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"category" text,
	"is_bookable" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 100,
	"icon_name" varchar(50) DEFAULT 'Wrench',
	"hero_title" text,
	"hero_subtitle" text,
	"hero_description" text,
	"features_json" jsonb DEFAULT '[]'::jsonb,
	"process_json" jsonb DEFAULT '[]'::jsonb,
	"pricing_base" text,
	"pricing_details" jsonb DEFAULT '[]'::jsonb,
	"pricing_media_prices" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "service_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workshop_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"location" text DEFAULT 'RevampIT, Birmensdorferstr. 379, 8055 Zürich',
	"instructor" text,
	"max_participants" integer,
	"notes" text,
	"status" text DEFAULT 'scheduled',
	"location_details" text,
	"instructor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workshop_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"instance_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"material_type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"file_size_bytes" integer,
	"access_type" varchar(20) DEFAULT 'registered',
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workshop_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"category" varchar(100),
	"duration_minutes" integer NOT NULL,
	"level" varchar(20) DEFAULT 'beginner' NOT NULL,
	"max_participants" integer DEFAULT 10 NOT NULL,
	"min_participants" integer DEFAULT 3 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"prerequisites" text,
	"learning_objectives" text[] DEFAULT '{}',
	"target_audience" text,
	"materials_provided" text,
	"materials_required" text,
	"location_type" varchar(20) DEFAULT 'venue' NOT NULL,
	"selected_location_id" uuid,
	"proposed_location" text,
	"proposed_date" date,
	"proposed_time" time,
	"special_requirements" text,
	"terms_accepted" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"edit_history" jsonb DEFAULT '[]'::jsonb,
	"last_edited_by" uuid,
	"last_edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workshop_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workshop_instance_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'not_required',
	"payment_amount_cents" integer,
	"payment_reference" text,
	"attended" boolean DEFAULT false,
	"rating" integer,
	"feedback" text,
	"notes" text,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"duration" text,
	"level" text,
	"max_participants" integer DEFAULT 12,
	"price_cents" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"short_description" text,
	"duration_minutes" integer,
	"min_participants" integer DEFAULT 3,
	"prerequisites" text,
	"learning_objectives" text[] DEFAULT '{}',
	"target_audience" text,
	"materials_provided" text,
	"materials_required" text,
	"featured_image" text,
	"instructor_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workshops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "review_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size_bytes" integer,
	"mime_type" varchar(100),
	"attachment_type" varchar(20) DEFAULT 'image',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid,
	"response_id" uuid,
	"action" varchar(50) NOT NULL,
	"reason" text,
	"admin_id" uuid NOT NULL,
	"old_status" varchar(20),
	"new_status" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"responder_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"moderation_reason" text,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "review_responses_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"vote_type" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"booking_id" uuid,
	"overall_rating" integer NOT NULL,
	"communication_rating" integer,
	"professionalism_rating" integer,
	"quality_rating" integer,
	"timeliness_rating" integer,
	"value_rating" integer,
	"title" varchar(200),
	"content" text NOT NULL,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_votes" integer DEFAULT 0 NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"moderation_reason" text,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"type" text NOT NULL,
	"context_id" text,
	"participant_1" uuid NOT NULL,
	"participant_2" uuid NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now(),
	"last_message_preview" text,
	"unread_count_1" integer DEFAULT 0,
	"unread_count_2" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"archived_by_1" boolean DEFAULT false,
	"archived_by_2" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"attachment_url" text,
	"attachment_name" text,
	"attachment_size" integer,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"delivery_status" text DEFAULT 'sent',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"related_type" text,
	"related_id" text,
	"sent_email" boolean DEFAULT false,
	"sent_sms" boolean DEFAULT false,
	"sent_in_app" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_new_messages" boolean DEFAULT true,
	"email_appointment_updates" boolean DEFAULT true,
	"email_marketplace_updates" boolean DEFAULT true,
	"in_app_messages" boolean DEFAULT true,
	"in_app_appointments" boolean DEFAULT true,
	"in_app_marketplace" boolean DEFAULT true,
	"sms_urgent_messages" boolean DEFAULT false,
	"sms_appointment_reminders" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "helper_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"avatar_url" text,
	"hourly_rate_cents" integer,
	"accepts_gratis" boolean DEFAULT true,
	"accepts_kulturlegi" boolean DEFAULT true,
	"service_types" text[] DEFAULT '{"remote","onsite"}',
	"location_postal_code" varchar(10),
	"location_city" varchar(100),
	"location_canton" varchar(50),
	"max_travel_km" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"suspended_at" timestamp with time zone,
	"admin_notes" text,
	"total_helps_completed" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "helper_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "it_hilfe_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"helper_id" uuid NOT NULL,
	"message" text NOT NULL,
	"estimated_time" varchar(50),
	"proposed_compensation" varchar(100),
	"relevant_skills" text[],
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "it_hilfe_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"device_brand" varchar(100),
	"device_model" varchar(200),
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"urgency" varchar(20) DEFAULT 'normal',
	"budget_type" varchar(20) NOT NULL,
	"budget_amount_cents" integer,
	"budget_tier" varchar(20),
	"postal_code" varchar(10) NOT NULL,
	"city" varchar(100) NOT NULL,
	"canton" varchar(50) NOT NULL,
	"service_type" varchar(20) DEFAULT 'flexible',
	"skills_needed" text[],
	"image_urls" text[],
	"status" varchar(30) DEFAULT 'open',
	"matched_offer_id" uuid,
	"offer_count" integer DEFAULT 0,
	"service_category" varchar(50) DEFAULT 'repair',
	"ai_diagnosis" text,
	"admin_notes" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" varchar(50) NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"motivation" text,
	"availability" text,
	"skills" text[],
	"experience" text,
	"start_date" date,
	"referring_organization" text,
	"case_manager_contact" text,
	"status" text DEFAULT 'submitted',
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"interview_date" timestamp with time zone,
	"decision_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "decision_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"position" text NOT NULL,
	"option_id" text,
	"parent_comment_id" uuid,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"decision_type" text NOT NULL,
	"voting_method" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quorum" jsonb DEFAULT '{"type":"percentage","value":50}'::jsonb NOT NULL,
	"blind_voting" boolean DEFAULT true NOT NULL,
	"dot_count" integer,
	"invited_participants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"discussion_deadline" timestamp with time zone,
	"voting_deadline" timestamp with time zone,
	"outcome" jsonb,
	"outcome_summary" text,
	"revealed_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"cancel_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount_cents" integer,
	"currency" text DEFAULT 'CHF',
	"payment_method" text,
	"payment_reference" text,
	"payment_date" timestamp with time zone,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"donor_name" text,
	"donor_email" text,
	"donor_address" text,
	"receipt_requested" boolean DEFAULT false,
	"receipt_sent" boolean DEFAULT false,
	"receipt_sent_at" timestamp with time zone,
	"notes" text,
	"thank_you_sent" boolean DEFAULT false,
	"thank_you_sent_at" timestamp with time zone,
	"donation_type" text DEFAULT 'monetary',
	"device_category" text,
	"device_description" text,
	"device_brand" text,
	"device_model" text,
	"device_condition" text,
	"device_age_years" integer,
	"estimated_value_cents" integer,
	"status" text DEFAULT 'recorded',
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"review_notes" text,
	"required_changes" text[],
	"reviewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"booked_by" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"expected_attendees" integer,
	"special_requirements" text,
	"status" varchar(20) DEFAULT 'confirmed',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"postal_code" varchar(10),
	"city" varchar(100) NOT NULL,
	"canton" varchar(50),
	"country" varchar(100) DEFAULT 'Switzerland',
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"max_capacity" integer,
	"facilities" text[] DEFAULT '{}',
	"contact_name" varchar(255),
	"contact_phone" varchar(50),
	"contact_email" varchar(255),
	"accessibility_info" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_approved" boolean DEFAULT false,
	"approval_status" varchar(20) DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meeting_protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_type" text NOT NULL,
	"visibility" text DEFAULT 'team' NOT NULL,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"raw_transcript" text,
	"structured_notes" jsonb,
	"processing_model" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"input_method" text DEFAULT 'transcript',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"frequency" text DEFAULT 'monthly',
	"topics" text[],
	"language" text DEFAULT 'de',
	"is_active" boolean DEFAULT true,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"source" text,
	"confirm_token" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "org_numbers" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"numeric_value" numeric,
	"label" text NOT NULL,
	"category" text NOT NULL,
	"confidence" text NOT NULL,
	"methodology" text,
	"calculation" text,
	"source_document" text,
	"external_link" text,
	"last_verified" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pool_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_chf" numeric(10, 2) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_reference" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pool_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pool_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"vote_type" text NOT NULL,
	"vote" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocol_action_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"action_item_id" text NOT NULL,
	"link_type" text NOT NULL,
	"linked_task_id" uuid,
	"linked_decision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocol_decision_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"action_item_id" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"closed_by" uuid,
	"closed_at" timestamp with time zone,
	"result" text DEFAULT 'pending' NOT NULL,
	"votes_up" integer DEFAULT 0 NOT NULL,
	"votes_down" integer DEFAULT 0 NOT NULL,
	"proposed_tasks" jsonb,
	"proposal_model" text,
	"tasks_created" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_decision_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"action_item_id" text NOT NULL,
	"voter_id" uuid NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" text NOT NULL,
	"service_category" text DEFAULT 'other' NOT NULL,
	"max_members" integer NOT NULL,
	"monthly_cost_chf" numeric(10, 2) NOT NULL,
	"cost_per_member_chf" numeric(10, 2) GENERATED ALWAYS AS (monthly_cost_chf / max_members) STORED,
	"owner_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"description" text,
	"rules" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_attention_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"flagged_by" uuid NOT NULL,
	"message" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolved_by_completion_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"completed_by" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	"duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"target_date" date,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_user_id" uuid,
	"is_broadcast" boolean GENERATED ALWAYS AS (requested_user_id IS NULL) STORED,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_message" text,
	"completion_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"task_type" text NOT NULL,
	"schedule_cron" text,
	"schedule_human" text,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"priority" text DEFAULT 'normal' NOT NULL,
	"estimated_minutes" integer,
	"current_status" text DEFAULT 'idle' NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"project_id" uuid,
	"created_by" uuid NOT NULL,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lockouts" ADD CONSTRAINT "user_lockouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_submissions" ADD CONSTRAINT "blog_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_submissions" ADD CONSTRAINT "blog_submissions_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_submissions" ADD CONSTRAINT "blog_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_submissions" ADD CONSTRAINT "blog_submissions_published_post_id_blog_posts_id_fk" FOREIGN KEY ("published_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_submissions" ADD CONSTRAINT "blog_submissions_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_customer_profiles" ADD CONSTRAINT "product_customer_profiles_profile_id_customer_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hirn_chat_history" ADD CONSTRAINT "hirn_chat_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hirn_chunks" ADD CONSTRAINT "hirn_chunks_document_id_hirn_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."hirn_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hirn_provider_settings" ADD CONSTRAINT "hirn_provider_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_updates" ADD CONSTRAINT "activity_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_requested_user_id_users_id_fk" FOREIGN KEY ("requested_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permission_requests" ADD CONSTRAINT "staff_permission_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permission_requests" ADD CONSTRAINT "staff_permission_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_profiles" ADD CONSTRAINT "team_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_submissions" ADD CONSTRAINT "user_content_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_submissions" ADD CONSTRAINT "user_content_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extracted_products" ADD CONSTRAINT "ai_extracted_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extracted_products" ADD CONSTRAINT "ai_extracted_products_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "ai_processing_logs_product_id_ai_extracted_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ai_extracted_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "ai_processing_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_ai_product_id_ai_extracted_products_id_fk" FOREIGN KEY ("ai_product_id") REFERENCES "public"."ai_extracted_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_ai_extracted_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ai_extracted_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustainability_scores" ADD CONSTRAINT "sustainability_scores_product_id_ai_extracted_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ai_extracted_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_favorites" ADD CONSTRAINT "listing_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_favorites" ADD CONSTRAINT "listing_favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_specs" ADD CONSTRAINT "listing_specs_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_applications" ADD CONSTRAINT "seller_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_applications" ADD CONSTRAINT "seller_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_releases" ADD CONSTRAINT "escrow_releases_escrow_account_id_escrow_accounts_id_fk" FOREIGN KEY ("escrow_account_id") REFERENCES "public"."escrow_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_releases" ADD CONSTRAINT "escrow_releases_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_releases" ADD CONSTRAINT "escrow_releases_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_analytics" ADD CONSTRAINT "payment_analytics_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_original_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("original_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refund_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("refund_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_applications" ADD CONSTRAINT "repairer_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_applications" ADD CONSTRAINT "repairer_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_availability" ADD CONSTRAINT "repairer_availability_repairer_id_repairer_profiles_id_fk" FOREIGN KEY ("repairer_id") REFERENCES "public"."repairer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD CONSTRAINT "repairer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_reviews" ADD CONSTRAINT "repairer_reviews_repairer_id_repairer_profiles_id_fk" FOREIGN KEY ("repairer_id") REFERENCES "public"."repairer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_reviews" ADD CONSTRAINT "repairer_reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_reviews" ADD CONSTRAINT "repairer_reviews_appointment_id_service_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."service_appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairer_services" ADD CONSTRAINT "repairer_services_repairer_id_repairer_profiles_id_fk" FOREIGN KEY ("repairer_id") REFERENCES "public"."repairer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_repairer_id_users_id_fk" FOREIGN KEY ("repairer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_repairer_profile_id_repairer_profiles_id_fk" FOREIGN KEY ("repairer_profile_id") REFERENCES "public"."repairer_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_instances" ADD CONSTRAINT "workshop_instances_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_instances" ADD CONSTRAINT "workshop_instances_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_materials" ADD CONSTRAINT "workshop_materials_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_materials" ADD CONSTRAINT "workshop_materials_instance_id_workshop_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."workshop_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_materials" ADD CONSTRAINT "workshop_materials_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_proposals" ADD CONSTRAINT "workshop_proposals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_proposals" ADD CONSTRAINT "workshop_proposals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_proposals" ADD CONSTRAINT "workshop_proposals_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_workshop_instance_id_workshop_instances_id_fk" FOREIGN KEY ("workshop_instance_id") REFERENCES "public"."workshop_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_attachments" ADD CONSTRAINT "review_attachments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation_log" ADD CONSTRAINT "review_moderation_log_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation_log" ADD CONSTRAINT "review_moderation_log_response_id_review_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."review_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_moderation_log" ADD CONSTRAINT "review_moderation_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_responder_id_users_id_fk" FOREIGN KEY ("responder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_1_users_id_fk" FOREIGN KEY ("participant_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_2_users_id_fk" FOREIGN KEY ("participant_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helper_profiles" ADD CONSTRAINT "helper_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helper_profiles" ADD CONSTRAINT "helper_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_hilfe_offers" ADD CONSTRAINT "it_hilfe_offers_request_id_it_hilfe_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."it_hilfe_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_hilfe_offers" ADD CONSTRAINT "it_hilfe_offers_helper_id_users_id_fk" FOREIGN KEY ("helper_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_hilfe_requests" ADD CONSTRAINT "it_hilfe_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_comments" ADD CONSTRAINT "decision_comments_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_comments" ADD CONSTRAINT "decision_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_votes" ADD CONSTRAINT "decision_votes_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_votes" ADD CONSTRAINT "decision_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_approvals" ADD CONSTRAINT "location_approvals_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_approvals" ADD CONSTRAINT "location_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_bookings" ADD CONSTRAINT "location_bookings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_bookings" ADD CONSTRAINT "location_bookings_booked_by_users_id_fk" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_protocols" ADD CONSTRAINT "meeting_protocols_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_contributions" ADD CONSTRAINT "pool_contributions_pool_id_subscription_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."subscription_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_contributions" ADD CONSTRAINT "pool_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_pool_id_subscription_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."subscription_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_votes" ADD CONSTRAINT "pool_votes_pool_id_subscription_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."subscription_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_votes" ADD CONSTRAINT "pool_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_action_links" ADD CONSTRAINT "protocol_action_links_protocol_id_meeting_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."meeting_protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_action_links" ADD CONSTRAINT "protocol_action_links_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_action_links" ADD CONSTRAINT "protocol_action_links_linked_decision_id_decisions_id_fk" FOREIGN KEY ("linked_decision_id") REFERENCES "public"."decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_decision_outcomes" ADD CONSTRAINT "protocol_decision_outcomes_protocol_id_meeting_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."meeting_protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_decision_outcomes" ADD CONSTRAINT "protocol_decision_outcomes_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_decision_votes" ADD CONSTRAINT "protocol_decision_votes_protocol_id_meeting_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."meeting_protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_decision_votes" ADD CONSTRAINT "protocol_decision_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_pools" ADD CONSTRAINT "subscription_pools_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attention_flags" ADD CONSTRAINT "task_attention_flags_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attention_flags" ADD CONSTRAINT "task_attention_flags_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attention_flags" ADD CONSTRAINT "task_attention_flags_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attention_flags" ADD CONSTRAINT "task_attention_flags_resolved_by_completion_id_task_completions_id_fk" FOREIGN KEY ("resolved_by_completion_id") REFERENCES "public"."task_completions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_requested_user_id_users_id_fk" FOREIGN KEY ("requested_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_completion_id_task_completions_id_fk" FOREIGN KEY ("completion_id") REFERENCES "public"."task_completions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_unique" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_id" ON "auth_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_event_type" ON "auth_audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_log_created_at" ON "auth_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_log_ip_address" ON "auth_audit_log" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_audit_log_severity" ON "auth_audit_log" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_event" ON "auth_audit_log" USING btree ("user_id","event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_lockouts_user_id" ON "user_lockouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_lockouts_locked_until" ON "user_lockouts" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_avatar_url" ON "user_profiles" USING btree ("avatar_url");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_display_name" ON "user_profiles" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_is_staff" ON "users" USING btree ("is_staff");--> statement-breakpoint
CREATE INDEX "idx_users_staff_permissions" ON "users" USING gin ("staff_permissions");--> statement-breakpoint
CREATE INDEX "idx_users_is_super_admin" ON "users" USING btree ("is_super_admin");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_published" ON "blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_published_at" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_category" ON "blog_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_slug" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_created_by" ON "blog_posts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_blog_submissions_status" ON "blog_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_blog_submissions_submitted_at" ON "blog_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_blog_submissions_submitter_email" ON "blog_submissions" USING btree ("submitter_email");--> statement-breakpoint
CREATE INDEX "idx_blog_submissions_last_edited" ON "blog_submissions" USING btree ("last_edited_at");--> statement-breakpoint
CREATE INDEX "idx_blog_submissions_edited_by" ON "blog_submissions" USING btree ("last_edited_by");--> statement-breakpoint
CREATE INDEX "idx_static_pages_slug" ON "static_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_static_pages_published" ON "static_pages" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_customer_profiles_active" ON "customer_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "product_customer_profiles_product_profile_unique" ON "product_customer_profiles" USING btree ("product_id","profile_id");--> statement-breakpoint
CREATE INDEX "idx_product_profiles_product" ON "product_customer_profiles" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_profiles_profile" ON "product_customer_profiles" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_hirn_chat_history_user_id" ON "hirn_chat_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_hirn_chat_history_session_id" ON "hirn_chat_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_hirn_chat_history_created_at" ON "hirn_chat_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_hirn_chunks_document_id" ON "hirn_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_hirn_documents_source_path" ON "hirn_documents" USING btree ("source_path");--> statement-breakpoint
CREATE INDEX "idx_hirn_documents_source_type" ON "hirn_documents" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_hirn_documents_content_hash" ON "hirn_documents" USING btree ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "hirn_provider_settings_scope_user_id_provider_key" ON "hirn_provider_settings" USING btree ("scope","user_id","provider");--> statement-breakpoint
CREATE INDEX "idx_hirn_provider_settings_scope" ON "hirn_provider_settings" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "idx_hirn_provider_settings_user_id" ON "hirn_provider_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_updates_user" ON "activity_updates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_updates_type" ON "activity_updates" USING btree ("update_type");--> statement-breakpoint
CREATE INDEX "idx_activity_updates_occurred" ON "activity_updates" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_activity_updates_visibility" ON "activity_updates" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_activity_updates_category" ON "activity_updates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_help_requests_requester" ON "help_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_help_requests_requested" ON "help_requests" USING btree ("requested_user_id");--> statement-breakpoint
CREATE INDEX "idx_help_requests_broadcast" ON "help_requests" USING btree ("is_broadcast");--> statement-breakpoint
CREATE INDEX "idx_help_requests_status" ON "help_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_help_requests_urgency" ON "help_requests" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "idx_help_requests_created" ON "help_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_permission_requests_user_id" ON "staff_permission_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_permission_requests_status" ON "staff_permission_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_permission_requests_reviewed_by" ON "staff_permission_requests" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_user_id" ON "team_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_department" ON "team_profiles" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_employment_type" ON "team_profiles" USING btree ("employment_type");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_is_active" ON "team_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_skills" ON "team_profiles" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "idx_team_profiles_current_focus" ON "team_profiles" USING btree ("current_focus_updated_at");--> statement-breakpoint
CREATE INDEX "idx_user_content_submissions_user_id" ON "user_content_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_content_submissions_status" ON "user_content_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_content_submissions_content_type" ON "user_content_submissions" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "idx_ai_products_status" ON "ai_extracted_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_products_brand" ON "ai_extracted_products" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "idx_ai_products_category" ON "ai_extracted_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ai_products_created_by" ON "ai_extracted_products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_ai_products_kivitendo" ON "ai_extracted_products" USING btree ("kivitendo_article_number");--> statement-breakpoint
CREATE INDEX "idx_inventory_status" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inventory_location" ON "inventory_items" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_inventory_kivitendo" ON "inventory_items" USING btree ("kivitendo_article_number");--> statement-breakpoint
CREATE INDEX "idx_inventory_assigned_to" ON "inventory_items" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_inventory_intake_tier" ON "inventory_items" USING btree ("intake_tier");--> statement-breakpoint
CREATE INDEX "idx_inventory_donation" ON "inventory_items" USING btree ("source_donation_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_checklist_complete" ON "inventory_items" USING btree ("checklist_complete");--> statement-breakpoint
CREATE INDEX "idx_listings_status" ON "marketplace_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_listings_platform" ON "marketplace_listings" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_listings_created_by" ON "marketplace_listings" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "product_attributes_category_id_name_unique" ON "product_attributes" USING btree ("category_id","name");--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "product_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_categories_level" ON "product_categories" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_categories_active" ON "product_categories" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_favorites_user_id_listing_id_unique" ON "listing_favorites" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_favorites_user" ON "listing_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_listing_favorites_listing" ON "listing_favorites" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_favorites_user_listing" ON "listing_favorites" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_images_listing" ON "listing_images" USING btree ("listing_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_reports_listing_id_reporter_id_unique" ON "listing_reports" USING btree ("listing_id","reporter_id");--> statement-breakpoint
CREATE INDEX "idx_listing_reports_listing" ON "listing_reports" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_reports_status" ON "listing_reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_specs_listing_id_spec_key_unique" ON "listing_specs" USING btree ("listing_id","spec_key");--> statement-breakpoint
CREATE INDEX "idx_listing_specs_listing" ON "listing_specs" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_specs_filter" ON "listing_specs" USING btree ("spec_key","normalized_value");--> statement-breakpoint
CREATE INDEX "idx_listings_active_browse" ON "listings" USING btree ("category","condition","created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_seller" ON "listings" USING btree ("seller_id","status");--> statement-breakpoint
CREATE INDEX "idx_listings_status_created" ON "listings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_buyer" ON "marketplace_orders" USING btree ("buyer_id","status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_seller" ON "marketplace_orders" USING btree ("seller_id","status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_listing" ON "marketplace_orders" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_seller_applications_user_id" ON "seller_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seller_applications_status" ON "seller_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_seller_applications_submitted_at" ON "seller_applications" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_user" ON "seller_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_verified" ON "seller_profiles" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_rating" ON "seller_profiles" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "idx_escrow_accounts_transaction_id" ON "escrow_accounts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_accounts_buyer_id" ON "escrow_accounts" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_accounts_seller_id" ON "escrow_accounts" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_accounts_status" ON "escrow_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_escrow_accounts_release_deadline" ON "escrow_accounts" USING btree ("release_deadline");--> statement-breakpoint
CREATE INDEX "idx_escrow_releases_escrow_account_id" ON "escrow_releases" USING btree ("escrow_account_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_releases_transaction_id" ON "escrow_releases" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_user_id" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_type" ON "invoices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_invoices_invoice_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_order_id" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_service_apt" ON "invoices" USING btree ("service_appointment_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_inventory_item" ON "order_items" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_status_history_order_id" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_status_history_created_at" ON "order_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_intent" ON "orders" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_seller_id" ON "orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_payment_analytics_date" ON "payment_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_payment_analytics_provider" ON "payment_analytics" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_analytics_date_provider_unique" ON "payment_analytics" USING btree ("date","provider_id");--> statement-breakpoint
CREATE INDEX "idx_payment_disputes_transaction_id" ON "payment_disputes" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_payment_disputes_status" ON "payment_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_disputes_provider_dispute_id" ON "payment_disputes" USING btree ("provider_dispute_id");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_user_id" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_provider" ON "payment_methods" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_default" ON "payment_methods" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_user_provider_method_unique" ON "payment_methods" USING btree ("user_id","provider_payment_method_id");--> statement-breakpoint
CREATE INDEX "idx_payment_providers_type" ON "payment_providers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_payment_providers_active" ON "payment_providers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_user_id" ON "payment_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_provider" ON "payment_transactions" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_status" ON "payment_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_type" ON "payment_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_created_at" ON "payment_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_provider_tx_id" ON "payment_transactions" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_order_id" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_service_apt" ON "payment_transactions" USING btree ("service_appointment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_workshop_reg" ON "payment_transactions" USING btree ("workshop_registration_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_original_transaction" ON "refunds" USING btree ("original_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_refund_transaction" ON "refunds" USING btree ("refund_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_status" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_refunds_requested_by" ON "refunds" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_repairer_applications_user_id" ON "repairer_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_applications_status" ON "repairer_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_repairer_availability_repairer_id" ON "repairer_availability" USING btree ("repairer_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_availability_date" ON "repairer_availability" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_repairer_availability_type" ON "repairer_availability" USING btree ("availability_type");--> statement-breakpoint
CREATE UNIQUE INDEX "repairer_availability_repairer_date_start_unique" ON "repairer_availability" USING btree ("repairer_id","date","start_time");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_user_id" ON "repairer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_verified" ON "repairer_profiles" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_active" ON "repairer_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_rating" ON "repairer_profiles" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_location" ON "repairer_profiles" USING btree ("city","postal_code");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_services" ON "repairer_profiles" USING gin ("services_offered");--> statement-breakpoint
CREATE INDEX "idx_repairer_profiles_specializations" ON "repairer_profiles" USING gin ("specializations");--> statement-breakpoint
CREATE INDEX "idx_repairer_reviews_repairer_id" ON "repairer_reviews" USING btree ("repairer_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_reviews_customer_id" ON "repairer_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_reviews_rating" ON "repairer_reviews" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "repairer_reviews_repairer_customer_appointment_unique" ON "repairer_reviews" USING btree ("repairer_id","customer_id","appointment_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_services_repairer_id" ON "repairer_services" USING btree ("repairer_id");--> statement-breakpoint
CREATE INDEX "idx_repairer_services_category" ON "repairer_services" USING btree ("service_category");--> statement-breakpoint
CREATE UNIQUE INDEX "repairer_services_repairer_category_name_unique" ON "repairer_services" USING btree ("repairer_id","service_category","service_name");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_user_id" ON "service_appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_repairer_id" ON "service_appointments" USING btree ("repairer_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_repairer_profile_id" ON "service_appointments" USING btree ("repairer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_service_appointments_repairer_status" ON "service_appointments" USING btree ("repairer_id","status");--> statement-breakpoint
CREATE INDEX "idx_service_types_category" ON "service_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_service_types_is_bookable" ON "service_types" USING btree ("is_bookable");--> statement-breakpoint
CREATE INDEX "idx_service_types_is_featured" ON "service_types" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_service_types_display_order" ON "service_types" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_service_types_features_json" ON "service_types" USING gin ("features_json");--> statement-breakpoint
CREATE INDEX "idx_service_types_process_json" ON "service_types" USING gin ("process_json");--> statement-breakpoint
CREATE INDEX "idx_workshop_instances_workshop_id" ON "workshop_instances" USING btree ("workshop_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_instances_instructor" ON "workshop_instances" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_materials_workshop" ON "workshop_materials" USING btree ("workshop_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_materials_instance" ON "workshop_materials" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_materials_active" ON "workshop_materials" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_workshop_proposals_user" ON "workshop_proposals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_proposals_status" ON "workshop_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workshop_proposals_category" ON "workshop_proposals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_workshop_proposals_created" ON "workshop_proposals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_workshop_registrations_user_id" ON "workshop_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workshop_registrations_instance_id" ON "workshop_registrations" USING btree ("workshop_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workshop_registrations_user_instance_unique" ON "workshop_registrations" USING btree ("user_id","workshop_instance_id");--> statement-breakpoint
CREATE INDEX "idx_workshops_instructor" ON "workshops" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "idx_workshops_created_by" ON "workshops" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_review_attachments_review_id" ON "review_attachments" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_moderation_log_review_id" ON "review_moderation_log" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_moderation_log_admin_id" ON "review_moderation_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_review_responses_review_id" ON "review_responses" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_responses_responder_id" ON "review_responses" USING btree ("responder_id");--> statement-breakpoint
CREATE INDEX "idx_review_responses_status" ON "review_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_votes_review_id" ON "review_votes" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_votes_voter_id" ON "review_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_votes_review_voter_unique" ON "review_votes" USING btree ("review_id","voter_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_reviewer_id" ON "reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_target" ON "reviews" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_status" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "idx_reviews_created_at" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_helpful" ON "reviews" USING btree ("helpful_votes","total_votes");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_reviewer_target_booking_unique" ON "reviews" USING btree ("reviewer_id","target_type","target_id","booking_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_participants" ON "conversations" USING btree ("participant_1","participant_2");--> statement-breakpoint
CREATE INDEX "idx_conversations_type_context" ON "conversations" USING btree ("type","context_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_last_message" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "idx_conversations_active" ON "conversations" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_participant_1_participant_2_type_context_id_key" ON "conversations" USING btree ("participant_1","participant_2","type","context_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_reaction_key" ON "message_reactions" USING btree ("message_id","user_id","reaction");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_messages_recipient" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_unread" ON "messages" USING btree ("recipient_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_scheduled" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_helper_profiles_user_id" ON "helper_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_helper_profiles_location" ON "helper_profiles" USING btree ("location_postal_code");--> statement-breakpoint
CREATE INDEX "idx_helper_profiles_canton" ON "helper_profiles" USING btree ("location_canton");--> statement-breakpoint
CREATE INDEX "idx_helper_profiles_active" ON "helper_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_helper_profiles_rating" ON "helper_profiles" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_offers_request_id" ON "it_hilfe_offers" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_offers_helper_id" ON "it_hilfe_offers" USING btree ("helper_id");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_offers_status" ON "it_hilfe_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_requests_user_id" ON "it_hilfe_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_requests_status" ON "it_hilfe_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_requests_category" ON "it_hilfe_requests" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_peer_repair_requests_postal_code" ON "it_hilfe_requests" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "idx_peer_repair_requests_canton" ON "it_hilfe_requests" USING btree ("canton");--> statement-breakpoint
CREATE INDEX "idx_peer_repair_requests_created" ON "it_hilfe_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_peer_repair_requests_browse" ON "it_hilfe_requests" USING btree ("status","canton","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_skills_user_id" ON "user_skills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_skills_skill_id" ON "user_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_user_skills_category_id" ON "user_skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_user_skills_verified" ON "user_skills" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "idx_applications_user_id" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_decision_comments_decision_id" ON "decision_comments" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "idx_decision_comments_user_id" ON "decision_comments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "decision_votes_decision_id_user_id_key" ON "decision_votes" USING btree ("decision_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_decision_votes_decision_id" ON "decision_votes" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "idx_decision_votes_user_id" ON "decision_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_decisions_status" ON "decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_decisions_created_by" ON "decisions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_decisions_voting_deadline" ON "decisions" USING btree ("voting_deadline");--> statement-breakpoint
CREATE INDEX "idx_donations_user_id" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_donations_type" ON "donations" USING btree ("donation_type");--> statement-breakpoint
CREATE INDEX "idx_donations_status" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_donations_created_at" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_donations_recorded_by" ON "donations" USING btree ("recorded_by");--> statement-breakpoint
CREATE INDEX "idx_locations_city" ON "locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_locations_type" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_locations_active" ON "locations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_protocols_meeting_date" ON "meeting_protocols" USING btree ("meeting_date");--> statement-breakpoint
CREATE INDEX "idx_protocols_meeting_type" ON "meeting_protocols" USING btree ("meeting_type");--> statement-breakpoint
CREATE INDEX "idx_protocols_status" ON "meeting_protocols" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_protocols_created_by" ON "meeting_protocols" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscriptions_email" ON "newsletter_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscriptions_confirm_token" ON "newsletter_subscriptions" USING btree ("confirm_token");--> statement-breakpoint
CREATE INDEX "idx_org_numbers_category" ON "org_numbers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_pool_contributions_pool" ON "pool_contributions" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "idx_pool_contributions_status" ON "pool_contributions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_memberships_pool_id_user_id_key" ON "pool_memberships" USING btree ("pool_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_pool_memberships_user" ON "pool_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pool_memberships_pool" ON "pool_memberships" USING btree ("pool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_votes_pool_id_voter_id_vote_type_key" ON "pool_votes" USING btree ("pool_id","voter_id","vote_type");--> statement-breakpoint
CREATE INDEX "idx_protocol_action_links_protocol" ON "protocol_action_links" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "idx_protocol_action_links_decision_id" ON "protocol_action_links" USING btree ("linked_decision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_decision_outcomes_protocol_id_action_item_id_key" ON "protocol_decision_outcomes" USING btree ("protocol_id","action_item_id");--> statement-breakpoint
CREATE INDEX "idx_protocol_decision_outcomes_protocol" ON "protocol_decision_outcomes" USING btree ("protocol_id");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_decision_votes_protocol_id_action_item_id_voter_id_key" ON "protocol_decision_votes" USING btree ("protocol_id","action_item_id","voter_id");--> statement-breakpoint
CREATE INDEX "idx_protocol_decision_votes_protocol" ON "protocol_decision_votes" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "idx_protocol_decision_votes_action" ON "protocol_decision_votes" USING btree ("protocol_id","action_item_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_pools_status" ON "subscription_pools" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_attention_flags_task" ON "task_attention_flags" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_completions_task" ON "task_completions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_completions_user" ON "task_completions" USING btree ("completed_by");--> statement-breakpoint
CREATE INDEX "idx_task_completions_date" ON "task_completions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_task_requests_user" ON "task_requests" USING btree ("requested_user_id");--> statement-breakpoint
CREATE INDEX "idx_task_requests_broadcast" ON "task_requests" USING btree ("is_broadcast");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "idx_tasks_category" ON "tasks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_tasks_type" ON "tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "idx_tasks_project" ON "tasks" USING btree ("project_id");