import { z } from "zod";
import { positiveMoneyCentsSchema } from "@/src/lib/money";
import { civilDateSchema } from "@/src/lib/date";

const baseTransactionSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  amountCents: positiveMoneyCentsSchema,
  description: z
    .string()
    .trim()
    .max(255, "Description must be at most 255 characters long")
    .optional(),
  date: civilDateSchema.optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export const createTransactionSchema = z.discriminatedUnion("type", [
  baseTransactionSchema.extend({ type: z.literal("expense") }),
  baseTransactionSchema.extend({ type: z.literal("income") }),
]);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = CreateTransactionInput;
