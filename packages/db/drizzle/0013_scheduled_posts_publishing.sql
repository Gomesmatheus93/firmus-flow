ALTER TYPE "public"."scheduled_post_status" ADD VALUE 'publicando' BEFORE 'publicado';--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD COLUMN "permalink" text;