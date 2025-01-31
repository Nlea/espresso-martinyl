CREATE TABLE IF NOT EXISTS "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"album" text,
	"mood" text,
	"bpm" integer,
	"additional_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vinyls" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"label" text,
	"year" integer,
	"owner" text NOT NULL,
	"genre[]" text,
	"style[]" text,
	"discogs_master_url" text,
	"discogs_uri" text
);
