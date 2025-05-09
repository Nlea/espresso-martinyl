import { tracks, artists, trackArtists } from '../../db/schema';
import type { Track } from '../../type';
import { eq } from 'drizzle-orm';
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

async function findOrCreateArtist(db: any, artistName: string): Promise<number> {
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
      discogsUri: artistName // Using name as URI since we don't have the actual URI
    })
    .returning({ id: artists.id });

  return result[0].id;
}

export async function insertTracks(vinylId: number, trackList: Track[], DATABASE_URL: string) {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  for (const track of trackList) {
    // Insert the track first
    const [insertedTrack] = await db.insert(tracks)
      .values({
        vinylId,
        position: track.position,
        title: track.title,
        duration: track.duration
      })
      .returning({ id: tracks.id });

    // Handle main artists
    const artistArray = Array.isArray(track.artists) ? track.artists : [track.artists];
    for (const artistName of artistArray) {
      const artistId = await findOrCreateArtist(db, artistName);
      await db.insert(trackArtists)
        .values({
          trackId: insertedTrack.id,
          artistId,
          role: 'main'
        });
    }

    // Handle extra artists
    if (track.extraartists) {
      const extraArtists = Array.isArray(track.extraartists) ? track.extraartists : [track.extraartists];
      for (const artistName of extraArtists) {
        const artistId = await findOrCreateArtist(db, artistName);
        await db.insert(trackArtists)
          .values({
            trackId: insertedTrack.id,
            artistId,
            role: 'extra'
          });
      }
    }
  }
}


