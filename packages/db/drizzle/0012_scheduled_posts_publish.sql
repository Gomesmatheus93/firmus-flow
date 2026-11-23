ALTER TABLE "scheduled_posts" ALTER COLUMN "scheduled_for" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD COLUMN "collaborators" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD COLUMN "comment_automation" boolean DEFAULT false NOT NULL;