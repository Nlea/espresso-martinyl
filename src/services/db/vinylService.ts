import { vinyls } from '../../db/schema';
import type { VinylInformation } from '../../type';

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export class VinylError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VinylError';
  }
}

export async function insertVinyl(vinylInfo: VinylInformation, owner: string, DATABASE_URL: string): Promise<number> {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);
  try {
    const result = await db.insert(vinyls)
      .values({
        title: vinylInfo.title,
        artists: vinylInfo.artists,
        label: vinylInfo.label,
        year: vinylInfo.year,
        genre: vinylInfo.genre,
        style: vinylInfo.style,
        discogsMasterUrl: vinylInfo.discogsMasterUrl,
        discogsUri: vinylInfo.discogsUri,
        owner: owner
      })
      .returning({ id: vinyls.id });
    
    return result[0].id;
  } catch (error: any) {
    console.error('Error inserting vinyl:', error);
    if (error.code === '23505') { // PostgreSQL unique violation error code
      throw new VinylError('A vinyl with this Discogs URI already exists for this owner', 'DUPLICATE_ENTRY');
    }
    throw error;
  }
}


