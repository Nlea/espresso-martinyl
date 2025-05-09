
import { Hono } from "hono";
import { getDiscogsInformation } from "./clients/discogs";
import { insertVinyl, getVinyl, getBasicVinyls, getVinylMetadata, getVinylTracks } from "./services/db/vinylService"; 
import { insertTracks } from "./services/db/trackService";
import { vinylInputSchema } from "./schemas/vinyl";
import { createFiberplane,  createOpenAPISpec} from "@fiberplane/hono";



// Define the type for environment bindings
interface Bindings {
  DATABASE_URL: string;
  GETSONGBPM_KEY: string;
  DISCOGS_KEY: string;
  DISCOGS_SECRET: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Define a route to check if the server is running
 app.get("/", (c) => {
   return c.text("Honc! 🪿");
 });

 // Get basic vinyl information
app.get("/api/vinyls", async (c) => {
  const vinyls = await getBasicVinyls(c.env.DATABASE_URL);
  return c.json(vinyls);
});

// Get detailed vinyl information including artists, genres, and styles
app.get("/api/vinyls/:id/metadata", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid vinyl ID" }, 400);
  }

  const vinyl = await getVinylMetadata(id, c.env.DATABASE_URL);
  if (!vinyl) {
    return c.json({ error: "Vinyl not found" }, 404);
  }

  return c.json(vinyl);
});

// Get tracks for a specific vinyl
app.get("/api/vinyls/:id/tracks", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid vinyl ID" }, 400);
  }

  const tracks = await getVinylTracks(id, c.env.DATABASE_URL);
  return c.json(tracks);
});


app.post("/api/vinyl",  async (c) => {
  
  try {
    const body = await c.req.json();
    const validatedData = vinylInputSchema.parse(body);

    // Check if we have either barcode OR (artist AND release_title)
    if (!validatedData.barcode && (!validatedData.artist || !validatedData.release_title)) {
      return c.json({ error: "Please provide either a barcode OR both artist and release title" }, 400);
    }

    const vinylInformation = await getDiscogsInformation(
      validatedData.barcode || '',  // Empty string if undefined
      validatedData.artist || '',   // Empty string if undefined
      validatedData.release_title || '',  // Empty string if undefined
      c.env.DISCOGS_KEY,
      c.env.DISCOGS_SECRET
    );

    if (!vinylInformation || 'error' in vinylInformation) {
      return c.json({ error: vinylInformation?.error || 'Failed to fetch vinyl information' }, 500);
    }

    console.log(vinylInformation);

    // Insert vinyl record and its tracks
    const vinylId = await insertVinyl(vinylInformation, validatedData.owner, c.env.DATABASE_URL);
    console.log(vinylId);

    await insertTracks(vinylId, vinylInformation.tracklist, c.env.DATABASE_URL);


    return c.json(vinylInformation);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError' && 'errors' in error) {
      return c.json({ 
        error: 'Validation failed', 
        details: (error as { errors: unknown }).errors 
      }, 400);
    }
    if (error instanceof Error && error.name === 'VinylError' && 'code' in error && error.code === 'DUPLICATE_ENTRY') {
      return c.json({ 
        error: error.message,
        code: 'DUPLICATE_ENTRY'
      }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});
app.get("/openapi.json", (c) => {
  const spec = createOpenAPISpec(app, {
    info: { title: "My API", version: "1.0.0" }
  });
  return c.json(spec);
});

app.use(
  "/fp/*",
  createFiberplane({
    openapi: {
      url: "/openapi.json"
    }
  })
);


export default app;

