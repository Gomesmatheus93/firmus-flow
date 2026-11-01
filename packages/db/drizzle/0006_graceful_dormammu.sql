ALTER TABLE "instagram_connections" ADD COLUMN "followers_count" integer;--> statement-breakpoint
ALTER TABLE "instagram_metrics" DROP COLUMN "impressions";--> statement-breakpoint
ALTER TABLE "instagram_metrics" DROP COLUMN "profile_views";