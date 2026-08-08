import { z } from "zod";

/** No maximum length — no precedent for one anywhere in the codebase
 *  (ContactMessage.message doesn't set one either), and body is
 *  @db.Text (unbounded). .trim() first means whitespace-only input fails
 *  the length check automatically, no separate check needed. */
export const submitReviewSchema = z.object({
  orderItemId: z.string().trim().min(1, "Missing order item."),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  body: z.string().trim().min(10, "Review must be at least 10 characters"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
