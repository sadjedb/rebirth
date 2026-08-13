import { z } from "zod";
import { getStatusRequirements } from "@/lib/products/status";

/** Preserves "not set" (undefined) rather than coercing an empty string to 0 —
 *  0 is a meaningfully different value from "no threshold configured" for
 *  compareAtPrice/costPrice/lowStockThreshold. */
const optionalNonNegativeInt = () =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(0).optional()
  );

export const mediaItemSchema = z.object({
  url: z.string().url(),
  providerId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().trim().optional(),
  position: z.number().int().min(0),
  /** Set only for media already persisted (loaded during Edit) — tells
   *  updateProduct to UPDATE that row instead of creating a new one. */
  dbId: z.string().optional(),
});

/** A reference to a Category/Collection/Tag that's either already chosen
 *  from existing options, or was just typed as a new one in the same
 *  combobox — resolved into a real row (upsert by slug) at save time. */
export const organizationRefSchema = z.union([
  z.object({ kind: z.literal("existing"), id: z.string() }),
  z.object({ kind: z.literal("new"), name: z.string().trim().min(1) }),
]);

export type OrganizationRef = z.infer<typeof organizationRefSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "URL slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  code: z.string().trim().min(1, "Display code is required"),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  details: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),

  price: z.coerce.number().int().min(0, "Price can't be negative"),
  compareAtPrice: optionalNonNegativeInt(),
  costPrice: optionalNonNegativeInt(),

  category: organizationRefSchema.nullable(),
  collections: z.array(organizationRefSchema).default([]),
  tags: z.array(organizationRefSchema).default([]),

  media: z.array(mediaItemSchema).default([]),

  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/** Only enforced when saving with a status that has requirements (currently
 *  only ACTIVE) — see lib/products/status.ts, the single source of truth
 *  for status rules, shared with Edit and Bulk Actions. */
export function getPublishErrors(values: ProductFormValues): string[] {
  return getStatusRequirements(values.status, values);
}
