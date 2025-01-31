ALTER TABLE "vinyls" ADD COLUMN "artists[]" text;--> statement-breakpoint
ALTER TABLE "vinyls" DROP COLUMN IF EXISTS "artist[]";