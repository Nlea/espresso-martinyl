import { vinyls, artists, genres, styles, vinylArtists, vinylGenres, vinylStyles, tracks, trackArtists } from '../../db/schema';
import type { VinylInformation } from '../../type';

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from 'drizzle-orm';

export class VinylError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VinylError';
  }
}

async function findOrCreateArtist(db: any, artistName: string, discogsUri: string = ''): Promise<number> {
  // Try to find existing artist
  const existingArtist = await db.select({ id: artists.id })
    .from(artists)
    .where(eq(artists.name, artistName))
    .limit(1);

  if (existingArtist.length > 0) {
    return existingArtist[0].id;
  }

  // Create new artist if not found
  const result = await db.insert(artists)
    .values({
      name: artistName,
      discogsUri: discogsUri || artistName // fallback to name if no URI
    })
    .returning({ id: artists.id });

  return result[0].id;
}

async function findOrCreateGenre(db: any, genreName: string): Promise<number> {
  const existingGenre = await db.select({ id: genres.id })
    .from(genres)
    .where(eq(genres.name, genreName))
    .limit(1);

  if (existingGenre.length > 0) {
    return existingGenre[0].id;
  }

  const result = await db.insert(genres)
    .values({ name: genreName })
    .returning({ id: genres.id });

  return result[0].id;
}

async function findOrCreateStyle(db: any, styleName: string): Promise<number> {
  const existingStyle = await db.select({ id: styles.id })
    .from(styles)
    .where(eq(styles.name, styleName))
    .limit(1);

  if (existingStyle.length > 0) {
    return existingStyle[0].id;
  }

  const result = await db.insert(styles)
    .values({ name: styleName })
    .returning({ id: styles.id });

  return result[0].id;
}

export async function insertVinyl(vinylInfo: VinylInformation, owner: string, DATABASE_URL: string): Promise<number> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  try {
    // First insert the vinyl
    const result = await db.insert(vinyls)
      .values({
        title: vinylInfo.title,
        label: vinylInfo.label,
        year: vinylInfo.year,
        discogsMasterUrl: vinylInfo.discogsMasterUrl,
        discogsUri: vinylInfo.discogsUri,
        owner: owner
      })
      .returning({ id: vinyls.id });
    
    const vinylId = result[0].id;

    // Handle artists
    const artistPromises = vinylInfo.artists.map(async (artistName) => {
      const artistId = await findOrCreateArtist(db, artistName);
      return db.insert(vinylArtists)
        .values({
          vinylId,
          artistId,
          role: 'main'
        });
    });

    // Handle genres
    const genrePromises = (vinylInfo.genre || []).map(async (genreName) => {
      const genreId = await findOrCreateGenre(db, genreName);
      return db.insert(vinylGenres)
        .values({
          vinylId,
          genreId
        });
    });

    // Handle styles
    const stylePromises = (vinylInfo.style || []).map(async (styleName) => {
      const styleId = await findOrCreateStyle(db, styleName);
      return db.insert(vinylStyles)
        .values({
          vinylId,
          styleId
        });
    });

    // Wait for all insertions to complete
    await Promise.all([
      ...artistPromises,
      ...genrePromises,
      ...stylePromises
    ]);

    return vinylId;
  } catch (error: any) {
    console.error('Error inserting vinyl:', error);
    if (error.code === '23505') { // PostgreSQL unique violation error code
      throw new VinylError('A vinyl with this Discogs URI already exists for this owner', 'DUPLICATE_ENTRY');
    }
    throw error;
  }
}

type VinylSearchParams = {
  id?: number;
  title?: string;
};

type BasicVinyl = {
  id: number;
  title: string;
  label: string | null;
  year: number | null;
  owner: string;
  discogsMasterUrl: string | null;
  discogsUri: string;
};

type VinylWithMetadata = BasicVinyl & {
  artists: { name: string; role: string }[];
  genres: string[];
  styles: string[];
};

type Track = {
  id: number;
  position: string;
  title: string;
  duration: string | null;
  bpm: number | null;
  key: string | null;
  artists: { name: string; role: string }[];
};

type VinylWithRelations = VinylWithMetadata & {
  tracks: Track[];
};

export async function getBasicVinyls(DATABASE_URL: string): Promise<BasicVinyl[]> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);
  return db.select().from(vinyls);
}

export async function getVinylMetadata(vinylId: number, DATABASE_URL: string): Promise<VinylWithMetadata | null> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  // Get basic vinyl info
  const vinylResults = await db.select().from(vinyls).where(eq(vinyls.id, vinylId));
  if (vinylResults.length === 0) return null;
  const vinyl = vinylResults[0];

  // Get artists
  const artistResults = await db
    .select({
      name: artists.name,
      role: vinylArtists.role
    })
    .from(vinylArtists)
    .innerJoin(artists, eq(artists.id, vinylArtists.artistId))
    .where(eq(vinylArtists.vinylId, vinylId))
    .then(results => results.map(r => ({
      name: r.name,
      role: r.role || 'main'
    })));

  // Get genres
  const genreResults = await db
    .select({
      name: genres.name
    })
    .from(vinylGenres)
    .innerJoin(genres, eq(genres.id, vinylGenres.genreId))
    .where(eq(vinylGenres.vinylId, vinylId));

  // Get styles
  const styleResults = await db
    .select({
      name: styles.name
    })
    .from(vinylStyles)
    .innerJoin(styles, eq(styles.id, vinylStyles.styleId))
    .where(eq(vinylStyles.vinylId, vinylId));

  return {
    ...vinyl,
    artists: artistResults,
    genres: genreResults.map(g => g.name),
    styles: styleResults.map(s => s.name)
  };
}

export async function getVinylTracks(vinylId: number, DATABASE_URL: string): Promise<Track[]> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  // Get tracks
  const trackResults = await db
    .select({
      id: tracks.id,
      position: tracks.position,
      title: tracks.title,
      duration: tracks.duration,
      bpm: tracks.bpm,
      key: tracks.key
    })
    .from(tracks)
    .where(eq(tracks.vinylId, vinylId));

  // Get artists for each track
  return Promise.all(trackResults.map(async (track) => {
    const trackArtistResults = await db
      .select({
        name: artists.name,
        role: trackArtists.role
      })
      .from(trackArtists)
      .innerJoin(artists, eq(artists.id, trackArtists.artistId))
      .where(eq(trackArtists.trackId, track.id))
      .then(results => results.map(r => ({
        name: r.name,
        role: r.role || 'main'
      })));

    return {
      ...track,
      artists: trackArtistResults
    };
  }));
}

export async function getVinyl(params: VinylSearchParams, DATABASE_URL: string): Promise<VinylWithRelations | null> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  // Build the where clause based on provided params
  let whereClause;
  if (params.id) {
    whereClause = eq(vinyls.id, params.id);
  } else if (params.title) {
    whereClause = eq(vinyls.title, params.title);
  } else {
    throw new Error('Either id or title must be provided');
  }

  // Get the basic vinyl information
  const vinylResults = await db.select().from(vinyls).where(whereClause);
  
  if (vinylResults.length === 0) {
    return null;
  }

  const vinyl = vinylResults[0];

  // Get artists with non-null roles
  const artistResults = await db
    .select({
      name: artists.name,
      role: vinylArtists.role
    })
    .from(vinylArtists)
    .innerJoin(artists, eq(artists.id, vinylArtists.artistId))
    .where(eq(vinylArtists.vinylId, vinyl.id))
    .then(results => results.map(r => ({
      name: r.name,
      role: r.role || 'main' // Default to 'main' if role is null
    })));

  // Get genres
  const genreResults = await db
    .select({
      name: genres.name
    })
    .from(vinylGenres)
    .innerJoin(genres, eq(genres.id, vinylGenres.genreId))
    .where(eq(vinylGenres.vinylId, vinyl.id));

  // Get styles
  const styleResults = await db
    .select({
      name: styles.name
    })
    .from(vinylStyles)
    .innerJoin(styles, eq(styles.id, vinylStyles.styleId))
    .where(eq(vinylStyles.vinylId, vinyl.id));

  // Get tracks
  const tracks = await getVinylTracks(vinyl.id, DATABASE_URL);

  // Combine all the data
  const vinylWithRelations: VinylWithRelations = {
    ...vinyl,
    artists: artistResults,
    genres: genreResults.map(g => g.name),
    styles: styleResults.map(s => s.name),
    tracks
  };

  return vinylWithRelations;
}
