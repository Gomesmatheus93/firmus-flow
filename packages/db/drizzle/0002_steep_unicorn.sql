CREATE TYPE "public"."platform_role" AS ENUM('operador');--> statement-breakpoint
CREATE TABLE "operator_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"route" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" "platform_role";--> statement-breakpoint
ALTER TABLE "operator_access" ADD CONSTRAINT "operator_access_operator_user_id_users_id_fk" FOREIGN KEY ("operator_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_access" ADD CONSTRAINT "operator_access_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operator_access_company_idx" ON "operator_access" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "operator_access_operator_idx" ON "operator_access" USING btree ("operator_user_id","created_at");