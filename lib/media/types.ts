export type MediaType = "IMAGE" | "VIDEO";

export type UploadedMedia = {
  url: string;
  /** Provider-specific asset identifier, needed to delete/transform later
   *  without an extra lookup. Opaque to callers — never parsed or
   *  constructed outside the provider that issued it. */
  providerId: string;
  /** Only present for video uploads — a generated poster frame. */
  thumbnailUrl?: string;
  type: MediaType;
};

export type UploadOptions = {
  folder?: string;
  resourceType?: "image" | "video";
};

/**
 * Every media storage provider (Cloudinary today; S3/R2/UploadThing/etc.
 * later) implements this. Nothing outside lib/media/ should import a
 * provider file directly or reference a provider-specific concept — only
 * this interface and the functions in lib/media/index.ts.
 */
export interface MediaProvider {
  upload(file: Buffer, options?: UploadOptions): Promise<UploadedMedia>;
  delete(providerId: string, resourceType?: "image" | "video"): Promise<void>;
}
