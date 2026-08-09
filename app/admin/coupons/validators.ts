import { z } from "zod";

/** Preserves "not set" (undefined) rather than coercing an empty string
 *  to 0/a default — same pattern as app/admin/products/validators.ts's
 *  optionalNonNegativeInt(), reused verbatim per-field below rather than
 *  imported, matching how each module owns its own validators.ts. */
const optionalNonNegativeInt = () =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(0).optional()
  );

const optionalPositiveInt = () =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).optional()
  );

const optionalDateInput = () =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  );

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .transform((v) => v.toUpperCase()),
    description: z.string().trim().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.coerce.number().int(),
    minOrderValue: optionalNonNegativeInt(),
    /** Undefined = unlimited. Distinct from 0, which isn't a meaningful
     *  usage limit — enforced as >= 1 by optionalPositiveInt(). */
    usageLimit: optionalPositiveInt(),
    startsAt: optionalDateInput(),
    endsAt: optionalDateInput(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  })
  .refine(
    (values) =>
      values.discountType !== "PERCENTAGE" ||
      (values.discountValue >= 1 && values.discountValue <= 100),
    { message: "Percentage discount must be between 1 and 100.", path: ["discountValue"] }
  )
  .refine((values) => values.discountType !== "FIXED_AMOUNT" || values.discountValue > 0, {
    message: "Fixed discount must be greater than $0.",
    path: ["discountValue"],
  })
  .refine((values) => !values.startsAt || !values.endsAt || values.endsAt > values.startsAt, {
    message: "End date must be after the start date.",
    path: ["endsAt"],
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;
