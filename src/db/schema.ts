import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export type NewSong = typeof songs.$inferInsert;

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  mood: text("mood"),
  bpm: integer("bpm"),
  additionalInfo: jsonb("additional_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vinyls = pgTable("vinyls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artists: text("artists[]"),
  label: text("label"),
  year: integer("year"),
  owner: text("owner").notNull(),
  genre: text("genre[]"),
  tracklist: text("tracklist[]"),
  style:  text("style[]"),
  discogsMasterUrl: text("discogs_master_url"),
  discogsUri: text("discogs_uri"),
});