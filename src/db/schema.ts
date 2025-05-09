import { pgTable, serial, text, integer, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";


export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  discogsUri: text("discogs_uri").notNull(),
}, (table) => {
  return {
    nameIdx: uniqueIndex("artist_name_idx").on(table.name),
    discogsUriIdx: uniqueIndex("artist_discogs_uri_idx").on(table.discogsUri),
  };
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}, (table) => {
  return {
    nameIdx: uniqueIndex("genre_name_idx").on(table.name),
  };
});

export const styles = pgTable("styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}, (table) => {
  return {
    nameIdx: uniqueIndex("style_name_idx").on(table.name),
  };
});

export const vinyls = pgTable("vinyls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  label: text("label"),
  year: integer("year"),
  owner: text("owner").notNull(),
  discogsMasterUrl: text("discogs_master_url"),
  discogsUri: text("discogs_uri").notNull(),
}, (table) => {
  return {
    vinylOwnerIdx: uniqueIndex("vinyl_owner_idx").on(table.discogsUri, table.owner),
  };
});

export const vinylGenres = pgTable("vinyl_genres", {
  vinylId: integer("vinyl_id").notNull().references(() => vinyls.id),
  genreId: integer("genre_id").notNull().references(() => genres.id),
}, (table) => {
  return {
    pk: primaryKey(table.vinylId, table.genreId),
  };
});

export const vinylStyles = pgTable("vinyl_styles", {
  vinylId: integer("vinyl_id").notNull().references(() => vinyls.id),
  styleId: integer("style_id").notNull().references(() => styles.id),
}, (table) => {
  return {
    pk: primaryKey(table.vinylId, table.styleId),
  };
});

export const vinylArtists = pgTable("vinyl_artists", {
  vinylId: integer("vinyl_id").notNull().references(() => vinyls.id),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  role: text("role").default("main"), // can be 'main' or 'extra'
}, (table) => {
  return {
    pk: primaryKey(table.vinylId, table.artistId),
  };
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  vinylId: integer("vinyl_id").references(() => vinyls.id),
  position: text("position").notNull(),
  title: text("title").notNull(),
  duration: text("duration"),
  bpm: integer("bpm"),
  key: text("key"),
});

export const trackArtists = pgTable("track_artists", {
  trackId: integer("track_id").notNull().references(() => tracks.id),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  role: text("role").default("main"), // can be 'main' or 'extra'
}, (table) => {
  return {
    pk: primaryKey(table.trackId, table.artistId),
  };
});