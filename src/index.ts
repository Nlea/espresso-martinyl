import { instrument } from "@fiberplane/hono-otel";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { getDiscogsInformation } from "./clients/discogs";
import { getSpotifySongInformation, getSpotifyToken, getSpotifySongAudioFeatures } from "./clients/spotify";
import type { VinylInformation, SpotifyTokenResponse } from "./type";
import { songs, vinyls } from "./db/schema";
import { eq, ne } from "drizzle-orm";

// Define the type for environment bindings
interface Bindings {
  DATABASE_URL: string;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  DISCOGS_KEY: string;
  DISCOGS_SECRET: string;
}

// Create a new Hono app with the specified bindings
const app = new Hono<{ Bindings: Bindings }>();

// Define a route to check if the server is running
app.get("/", (c) => {
  return c.text("Honc! 🪿");
});

app.post("/api/vinyl", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);
  const { barcode, artist, release_title, owner } = await c.req.json();

  const vinylInformation = await getDiscogsInformation(barcode, artist, release_title, c.env.DISCOGS_KEY, c.env.DISCOGS_SECRET);

  if (!vinylInformation || 'error' in vinylInformation) {
    return c.json({ error: vinylInformation?.error || 'Failed to fetch vinyl information' }, 500);
  }

  await db.insert(vinyls).values({
    title: vinylInformation.title,
    artists: vinylInformation.artists, 
    label: vinylInformation.label,
    year: vinylInformation.year,
    tracklist: vinylInformation.tracklist,
    owner: owner,
    genre: vinylInformation.genre, 
    style: vinylInformation.style,
  });


return c.json(vinylInformation);
});



app.post("/api/spotify", async (c) => {
  try {
    const tokenData = await getSpotifyToken();
    const token = tokenData.access_token;
    //artists needs to be lowercase
    //console.log(token);
    const artists = ["tigerbalm", "farafi"];
    const songInfo = await getSpotifySongInformation(token, "Nina", artists);
    //const filteredTracks = filterTracksByArtists(songInfo, ["Tigerbalm", "Farafi"]);
    
    const filteredTracks = songInfo.tracks.items.filter(track => {
      // Extract artist names for the current track
      const trackArtists = track.artists.map(artist => artist.name.toLowerCase().trim());
    
      // Check if all specified artists are included and the track contains no additional artists
      return (
        artists.every(name => trackArtists.includes(name)) &&
        trackArtists.length === artists.length // Ensure no additional artists
      );
    });
    
    const songId = filteredTracks[0].id;
    //const tokenData2 = await getSpotifyToken();
    //const token2 = tokenData2.access_token;
    const songAudioFeatures = await getSpotifySongAudioFeatures(token, songId);


    return c.json(songAudioFeatures); // Return the JSON response
    //return c.json(token); // Return the JSON response



  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
  
});

interface Track {
  artists: { name: string }[];
}

interface SongInfo {
  tracks: {
    items: Track[];
  };
}

function filterTracksByArtists(songInfo: SongInfo, artistNames: string[]): Track[] {
  return songInfo.tracks.items.filter(items => {
    const trackArtists = items.artists.map(artist => artist.name.toLowerCase());
    return artistNames.every(artistName => trackArtists.includes(artistName.toLowerCase()));
  });
}





export default instrument(app);