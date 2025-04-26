import { pgTable, serial, text, integer, uniqueIndex } from "drizzle-orm/pg-core";


export const vinyls = pgTable("vinyls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artists: text("artists").array(),
  label: text("label"),
  year: integer("year"),
  owner: text("owner").notNull(),
  genre: text("genre").array(),
  style: text("style").array(),
  discogsMasterUrl: text("discogs_master_url"),
  discogsUri: text("discogs_uri").notNull(), // Made required since it's part of unique constraint
}, (table) => {
  return {
    vinylOwnerIdx: uniqueIndex("vinyl_owner_idx").on(table.discogsUri, table.owner),
  };
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  vinylId: integer("vinyl_id").references(() => vinyls.id),
  position: text("position").notNull(),
  title: text("title").notNull(),
  artists: text("artists").array(),
  duration: text("duration"),
  extraArtists: text("extra_artists").array(),
});