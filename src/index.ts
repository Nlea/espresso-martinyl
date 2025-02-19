import { instrument } from "@fiberplane/hono-otel";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getDiscogsInformation } from "./clients/discogs";
import { getSpotifySongInformation, getSpotifyToken, getSpotifySongAudioFeatures } from "./clients/spotify";
import { songs, vinyls } from "./db/schema";
import { vinylInputSchema } from "./schemas/vinyl";
//import { zValidator } from "@hono/zod-validator";
import { customZodValidator } from './middleware/validator';
import { validator } from 'hono/validator';
import { createMiddleware } from "@fiberplane/embedded";
import { createFiberplane,  createOpenAPISpec} from "@fiberplane/hono";

//import apiSpec from './openapi.json';


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
//const app = new OpenAPIHono<{ Bindings: Bindings }>();



// Define a route to check if the server is running
 app.get("/", (c) => {
   return c.text("Honc! 🪿");
 });



//API Vinyl Route with Zod validation
//app.post("/api/vinyl", zValidator("json", vinylInputSchema), async (c) => {
app.post("/api/vinyl", customZodValidator("json", vinylInputSchema), async (c) => {
  

const body = c.req.valid("json");

  try {
    //const body = await c.req.json();
    //const validatedData = vinylInputSchema.parse(body);

    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);

    // Check if we have either barcode OR (artist AND release_title)
    if (!body.barcode && (!body.artist || !body.release_title)) {
      return c.json({ error: "Please provide either a barcode OR both artist and release title" }, 400);
    }

    const vinylInformation = await getDiscogsInformation(
      body.barcode || '',  // Empty string if undefined
      body.artist || '',   // Empty string if undefined
      body.release_title || '',  // Empty string if undefined
      c.env.DISCOGS_KEY,
      c.env.DISCOGS_SECRET
    );

    if (!vinylInformation || 'error' in vinylInformation) {
      return c.json({ error: vinylInformation?.error || 'Failed to fetch vinyl information' }, 500);
    }

    await db.insert(vinyls).values({
      title: vinylInformation.title,
      artists: Array.isArray(vinylInformation.artists) ? vinylInformation.artists.join(',') : vinylInformation.artists,
      label: vinylInformation.label,
      year: typeof vinylInformation.year === 'number' ? vinylInformation.year : null,
      owner: body.owner,
      genre: Array.isArray(vinylInformation.genre) ? vinylInformation.genre.join(',') : vinylInformation.genre,
      tracklist: Array.isArray(vinylInformation.tracklist) ? vinylInformation.tracklist.join(',') : vinylInformation.tracklist,
      style: Array.isArray(vinylInformation.style) ? vinylInformation.style.join(',') : vinylInformation.style,
      discogsMasterUrl: vinylInformation.discogsMasterUrl,
      discogsUri: vinylInformation.discogsUri
    });

    return c.json(vinylInformation);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError' && 'errors' in error) {
      return c.json({ 
        error: 'Validation failed', 
        details: (error as { errors: unknown }).errors 
      }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get("/openapi.json", (c) => {
  const spec = createOpenAPISpec(app, {
    info: { title: "My API", version: "1.0.0" },
  });
  return c.json(spec);
});


app.use("/fp/*", createFiberplane({
  openapi: { url: "/openapi.json" },
}));

export default instrument(app);




/*
app.post("/api/spotify", async (c) => {
  try {
    const tokenData = await getSpotifyToken();
    const token = tokenData.access_token;
    //artists needs to be lowercase
    //console.log(token);
    const artists = ["tigerbalm", "farafi"];
    const songInfo = await getSpotifySongInformation(token, "Nina", artists);
    //const filteredTracks = filterTracksByArtists(songInfo, ["Tigerbalm", "Farafi"]);
    
    const filteredTracks = songInfo.tracks.items.filter((track: Track) => {
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
  return songInfo.tracks.items.filter((items: Track) => {
    const trackArtists = items.artists.map(artist => artist.name.toLowerCase());
    return artistNames.every(artistName => trackArtists.includes(artistName.toLowerCase()));
  });
}

*/

//const app = new OpenAPIHono<{ Bindings: Bindings}>();

/*
const root = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "text/plain": { schema: z.string() } },
      description: "Root fetched successfully",
    },
  },
});

const postVinyl = createRoute({
  method: "post",
  path: "/api/vinyl",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: vinylInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Vinyl created successfully",
      content: {
        "application/json": {
          schema: z.object({
            title: z.string(),
            artists: z.union([z.string(), z.array(z.string())]),
            label: z.string(),
            year: z.number().nullable(),
            owner: z.string(),
            genre: z.union([z.string(), z.array(z.string())]),
            tracklist: z.union([z.string(), z.array(z.string())]),
            style: z.union([z.string(), z.array(z.string())]),
            discogsMasterUrl: z.string(),
            discogsUri: z.string()
          })
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.any().optional()
          })
        }
      }
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string()
          })
        }
      }
    }
  },
});

  app.openapi(root, (c) => {
    return c.text("Honc from above! ☁️🪿");
  })
.openapi(postVinyl, async (c) => {
  try {
    const body = c.req.valid("json");

    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);

    if (!body.barcode && (!body.artist || !body.release_title)) {
      return c.json({ error: "Please provide either a barcode OR both artist and release title" }, 400);
    }

    const vinylInformation = await getDiscogsInformation(
      body.barcode || '',
      body.artist || '',
      body.release_title || '',
      c.env.DISCOGS_KEY,
      c.env.DISCOGS_SECRET
    );

    if (!vinylInformation || 'error' in vinylInformation) {
      return c.json({ error: vinylInformation?.error || 'Failed to fetch vinyl information' }, 500);
    }

    await db.insert(vinyls).values({
      title: vinylInformation.title,
      artists: Array.isArray(vinylInformation.artists) ? vinylInformation.artists.join(',') : vinylInformation.artists,
      label: vinylInformation.label,
      year: typeof vinylInformation.year === 'number' ? vinylInformation.year : null,
      owner: body.owner,
      genre: Array.isArray(vinylInformation.genre) ? vinylInformation.genre.join(',') : vinylInformation.genre,
      tracklist: Array.isArray(vinylInformation.tracklist) ? vinylInformation.tracklist.join(',') : vinylInformation.tracklist,
      style: Array.isArray(vinylInformation.style) ? vinylInformation.style.join(',') : vinylInformation.style,
      discogsMasterUrl: vinylInformation.discogsMasterUrl,
      discogsUri: vinylInformation.discogsUri
    });

    return c.json(vinylInformation, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError' && 'errors' in error) {
      return c.json({ 
        error: 'Validation failed', 
        details: (error as { errors: unknown }).errors 
      }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});


*/

