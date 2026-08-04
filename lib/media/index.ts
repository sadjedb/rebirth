import "server-only";
import type { MediaProvider, UploadedMedia, UploadOptions } from "@/lib/media/types";
import { cloudinaryProvider } from "@/lib/media/providers/cloudinary";

export type { UploadedMedia, UploadOptions, MediaType } from "@/lib/media/types";

/**
 * The active provider. To switch providers, write a new file in
 * providers/ implementing MediaProvider and change this one line — no
 * other file in the app references Cloudinary (or whatever replaces it).
 */
const provider: MediaProvider = cloudinaryProvider;

export async function uploadMedia(file: Buffer, options?: UploadOptions): Promise<UploadedMedia> {
  return provider.upload(file, options);
}

export async function deleteMedia(providerId: string, resourceType?: "image" | "video"): Promise<void> {
  return provider.delete(providerId, resourceType);
}
