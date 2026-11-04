CREATE TABLE "company_templates" (
	"company_id" uuid NOT NULL,
	"template_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_templates_company_id_template_key_pk" PRIMARY KEY("company_id","template_key")
);
--> statement-breakpoint
ALTER TABLE "company_templates" ADD CONSTRAINT "company_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;