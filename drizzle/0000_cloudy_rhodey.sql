CREATE TABLE IF NOT EXISTS "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"vinyl_id" integer,
	"position" text NOT NULL,
	"title" text NOT NULL,
	"artists" text[],
	"duration" text,
	"extra_artists" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vinyls" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artists" text[],
	"label" text,
	"year" integer,
	"owner" text NOT NULL,
	"genre" text[],
	"style" text[],
	"discogs_master_url" text,
	"discogs_uri" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tracks" ADD CONSTRAINT "tracks_vinyl_id_vinyls_id_fk" FOREIGN KEY ("vinyl_id") REFERENCES "public"."vinyls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
