import { z } from "zod";

export const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentType: z.enum(["CASH", "CREDIT"]),
  customerId: z.string().min(1).optional(),
});

export const reminderSchema = z.object({
  customerId: z.string().min(1),
});
