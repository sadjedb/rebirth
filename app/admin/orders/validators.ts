import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  to: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]),
});

export const updatePaymentStatusSchema = z.object({
  to: z.enum(["PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"]),
});

export const updateFulfillmentStatusSchema = z.object({
  to: z.enum(["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED"]),
});

export const addOrderNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Note can't be empty.")
    .max(2000, "Note is too long (2000 characters max)."),
});
