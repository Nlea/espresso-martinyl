CREATE TABLE IF NOT EXISTS "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"discogs_uri" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "track_artists" (
	"track_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"role" text DEFAULT 'main',
	CONSTRAINT "track_artists_track_id_artist_id_pk" PRIMARY KEY("track_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vinyl_artists" (
	"vinyl_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"role" text DEFAULT 'main',
	CONSTRAINT "vinyl_artists_vinyl_id_artist_id_pk" PRIMARY KEY("vinyl_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vinyl_genres" (
	"vinyl_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "vinyl_genres_vinyl_id_genre_id_pk" PRIMARY KEY("vinyl_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vinyl_styles" (
	"vinyl_id" integer NOT NULL,
	"style_id" integer NOT NULL,
	CONSTRAINT "vinyl_styles_vinyl_id_style_id_pk" PRIMARY KEY("vinyl_id","style_id")
);
--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "bpm" integer;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "key" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_artists" ADD CONSTRAINT "vinyl_artists_vinyl_id_vinyls_id_fk" FOREIGN KEY ("vinyl_id") REFERENCES "public"."vinyls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_artists" ADD CONSTRAINT "vinyl_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_genres" ADD CONSTRAINT "vinyl_genres_vinyl_id_vinyls_id_fk" FOREIGN KEY ("vinyl_id") REFERENCES "public"."vinyls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_genres" ADD CONSTRAINT "vinyl_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_styles" ADD CONSTRAINT "vinyl_styles_vinyl_id_vinyls_id_fk" FOREIGN KEY ("vinyl_id") REFERENCES "public"."vinyls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vinyl_styles" ADD CONSTRAINT "vinyl_styles_style_id_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "artist_name_idx" ON "artists" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "artist_discogs_uri_idx" ON "artists" USING btree ("discogs_uri");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "genre_name_idx" ON "genres" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "style_name_idx" ON "styles" USING btree ("name");--> statement-breakpoint
ALTER TABLE "tracks" DROP COLUMN IF EXISTS "artists";--> statement-breakpoint
ALTER TABLE "tracks" DROP COLUMN IF EXISTS "extra_artists";--> statement-breakpoint
ALTER TABLE "vinyls" DROP COLUMN IF EXISTS "artists";--> statement-breakpoint
ALTER TABLE "vinyls" DROP COLUMN IF EXISTS "genre";--> statement-breakpoint
ALTER TABLE "vinyls" DROP COLUMN IF EXISTS "style";