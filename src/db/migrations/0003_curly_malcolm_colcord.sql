ALTER TABLE "contacts" ADD COLUMN "source" text DEFAULT 'form' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "closed_test_invited_at" timestamp with time zone;