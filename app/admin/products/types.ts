import type { z } from "zod";
import type { mediaItemSchema, organizationRefSchema } from "@/app/admin/products/validators";

/** Same shape the server expects, plus a client-only `id` for React keys
 *  and stable reordering (never sent to the server — position is derived
 *  from array order at submit time). */
export type FormMediaItem = z.infer<typeof mediaItemSchema> & { id: string };

export type OrganizationOption = { id: string; label: string };

export type OrganizationRefValue = z.infer<typeof organizationRefSchema>;

export type ProductFormState = {
  name: string;
  slug: string;
  slugManuallyEdited: boolean;
  code: string;
  shortDescription: string;
  description: string;
  details: string[];
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  /** Concurrency token — the record's updatedAt as of when it was loaded.
   *  Empty for Create (nothing to be stale against yet). Never set via
   *  user interaction; only productToFormState populates it. */
  updatedAt: string;

  price: string;
  compareAtPrice: string;
  costPrice: string;

  category: OrganizationRefValue | null;
  collections: OrganizationRefValue[];
  tags: OrganizationRefValue[];

  media: FormMediaItem[];

  metaTitle: string;
  metaDescription: string;
};

