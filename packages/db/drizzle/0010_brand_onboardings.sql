CREATE TABLE "brand_onboardings" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visual" jsonb,
	"status" text DEFAULT 'respondendo' NOT NULL,
	"draft" jsonb,
	"error_message" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_onboardings" ADD CONSTRAINT "brand_onboardings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;