CREATE TABLE "membership_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"address_street" text,
	"address_postal_code" text,
	"address_city" text,
	"birth_date" date,
	"member_type" text DEFAULT 'regular',
	"motivation" text,
	"status" text DEFAULT 'pending',
	"admin_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "workshop_instances" ALTER COLUMN "location" SET DEFAULT 'Revamp-IT, Birmensdorferstrasse 379, 8055 Zürich';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_member" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "member_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "member_type" text DEFAULT 'regular';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "member_paid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "kivvi_inventory_item_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "kivvi_sync_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "kivvi_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD COLUMN "accepts_gratis" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD COLUMN "accepts_kulturlegi" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD COLUMN "max_travel_km" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD COLUMN "service_delivery_types" text[] DEFAULT '{flexible}';--> statement-breakpoint
ALTER TABLE "repairer_profiles" ADD COLUMN "profile_tier" text DEFAULT 'professional';--> statement-breakpoint
ALTER TABLE "it_hilfe_offers" ADD COLUMN "repairer_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "it_hilfe_requests" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "it_hilfe_requests" ADD COLUMN "completed_by" uuid;--> statement-breakpoint
ALTER TABLE "it_hilfe_requests" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "category" text DEFAULT 'operativ';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_membership_applications_user_id" ON "membership_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_membership_applications_status" ON "membership_applications" USING btree ("status");--> statement-breakpoint
ALTER TABLE "it_hilfe_offers" ADD CONSTRAINT "it_hilfe_offers_repairer_profile_id_repairer_profiles_id_fk" FOREIGN KEY ("repairer_profile_id") REFERENCES "public"."repairer_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_hilfe_requests" ADD CONSTRAINT "it_hilfe_requests_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_staff_created" ON "users" USING btree ("is_staff","createdAt");--> statement-breakpoint
CREATE INDEX "idx_listings_verified_at" ON "listings" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "idx_listings_price_chf" ON "listings" USING btree ("price_chf");--> statement-breakpoint
CREATE INDEX "idx_it_hilfe_offers_repairer_profile" ON "it_hilfe_offers" USING btree ("repairer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_kivvi_inventory_item_id_unique" UNIQUE("kivvi_inventory_item_id");