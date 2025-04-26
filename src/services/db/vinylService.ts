import { vinyls } from '../../db/schema';
import type { VinylInformation } from '../../type';

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

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
  } catch (error) {
    console.error('Error inserting vinyl:', error);
    throw error;
  }
}


