"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { submitReviewSchema } from "@/lib/reviews/validators";
import { submitReview } from "@/lib/reviews/storefront";

export type SubmitReviewActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Partial<Record<string, string>> };

export async function submitReviewAction(
  raw: Record<string, string>
): Promise<SubmitReviewActionResult> {
  const user = await getSession();
  if (!user) {
    return { success: false, error: "You must be logged in to write a review." };
  }

  const parsed = submitReviewSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, error: "Please fix the errors below.", fieldErrors };
  }

  const result = await submitReview({ id: user.id, email: user.email }, parsed.data);
  if (result.success) {
    revalidatePath("/account");
  }
  return result;
}
