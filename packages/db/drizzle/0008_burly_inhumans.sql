CREATE TABLE "instagram_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"ig_media_id" text NOT NULL,
	"caption" text,
	"media_type" text NOT NULL,
	"media_product_type" text,
	"permalink" text,
	"thumbnail_url" text,
	"posted_at" timestamp with time zone NOT NULL,
	"likes" integer,
	"comments" integer,
	"reach" integer,
	"views" integer,
	"saves" integer,
	"shares" integer,
	"profile_visits" integer,
	"total_interactions" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_media_company_media_unique" UNIQUE("company_id","ig_media_id")
);
--> statement-breakpoint
CREATE TABLE "instagram_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"refused" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_snapshots_companyId_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "instagram_media" ADD CONSTRAINT "instagram_media_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_snapshots" ADD CONSTRAINT "instagram_snapshots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;