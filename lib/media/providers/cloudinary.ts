import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { MediaProvider, UploadedMedia, UploadOptions } from "@/lib/media/types";

/**
 * ⚠️ REQUIRES REAL CREDENTIALS TO ACTUALLY WORK.
 * Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in
 * .env (see .env.example). Written carefully against Cloudinary's
 * documented SDK API but not exercised against a live upload — verify the
 * first real upload yourself once credentials are in place.
 *
 * This file is the ONLY place in the app that should import the
 * `cloudinary` package or reference Cloudinary-specific concepts
 * (public_id, resource_type, etc). Everything else — lib/media/index.ts
 * and every module that uploads media — talks to the generic
 * MediaProvider interface only.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinaryProvider: MediaProvider = {
  async upload(file: Buffer, options: UploadOptions = {}): Promise<UploadedMedia> {
    const resourceType = options.resourceType ?? "image";
    const folder = options.folder ?? "mono/products";

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve(uploadResult);
        }
      );
      uploadStream.end(file);
    });

    const type: UploadedMedia["type"] = resourceType === "video" ? "VIDEO" : "IMAGE";

    return {
      url: result.secure_url,
      providerId: result.public_id,
      type,
      thumbnailUrl:
        type === "VIDEO"
          ? cloudinary.url(result.public_id, { resource_type: "video", format: "jpg" })
          : undefined,
    };
  },

  async delete(providerId: string, resourceType: "image" | "video" = "image"): Promise<void> {
    await cloudinary.uploader.destroy(providerId, { resource_type: resourceType });
  },
};
