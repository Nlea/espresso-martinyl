import { z } from "zod";

// Schema for when barcode is provided
const barcodeSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  artist: z.string().optional(),
  release_title: z.string().optional(),
  owner: z.string().min(1, "Owner is required"),
});

// Schema for when manual entry is needed (no barcode)
const manualEntrySchema = z.object({
  barcode: z.string().optional(),
  artist: z.string().min(1, "Artist is required when barcode is not provided"),
  release_title: z.string().min(1, "Release title is required when barcode is not provided"),
  owner: z.string().min(1, "Owner is required"),
});

// Combined schema that validates either barcode or manual entry
export const vinylInputSchema = z.union([
  barcodeSchema,
  manualEntrySchema
]).refine(
  (data) => {
    // Either barcode must be present, or both artist and release_title must be present
    return (
      (data.barcode && data.barcode.length > 0) || 
      (data.artist && data.artist.length > 0 && data.release_title && data.release_title.length > 0)
    );
  },
  {
    message: "Either barcode or both artist and release title must be provided"
  }
);

export type VinylInput = z.infer<typeof vinylInputSchema>;
