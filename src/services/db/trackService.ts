import { tracks } from '../../db/schema';
import type { Track } from '../../type';
import { eq } from 'drizzle-orm';
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export async function insertTracks(vinylId: number, trackList: Track[], DATABASE_URL: string) {

    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);

  const trackInserts = trackList.map(track => {
    // Convert string to array if needed
    const artistArray = Array.isArray(track.artists) ? track.artists : [track.artists];
    
    return {
      vinylId,
      position: track.position,
      title: track.title,
      artists: artistArray,
      duration: track.duration,
      extraArtists: track.extraartists ? Array.isArray(track.extraartists) ? track.extraartists : [track.extraartists] : []
    };
  });

  await db.insert(tracks).values(trackInserts);
}


