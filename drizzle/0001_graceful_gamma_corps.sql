ALTER TABLE "vinyls" ADD COLUMN "artist[]" text;--> statement-breakpoint
ALTER TABLE "vinyls" DROP COLUMN IF EXISTS "artist";