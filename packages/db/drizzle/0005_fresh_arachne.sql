CREATE TABLE "instagram_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"ig_account_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token_cipher" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone,
	CONSTRAINT "instagram_connections_companyId_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;