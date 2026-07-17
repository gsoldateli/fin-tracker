import { z } from "zod";
import { moneyCentsSchema, positiveMoneyCentsSchema } from "@/src/lib/money";
import { civilDateSchema } from "@/src/lib/date";

export const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit"] as const;

export const createAccountSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(ACCOUNT_TYPES, { message: "Invalid type" }),
    initialBalanceCents: z.coerce.number().pipe(moneyCentsSchema).default(0),
    initialBalanceDate: civilDateSchema.optional(),
});

export type CreateAccountInput = Omit<z.infer<typeof createAccountSchema>, "initialBalanceCents"> & {
    initialBalanceCents?: number;
    initialBalanceDate?: string;
};


export const transferSchema = z
    .object({
        fromId: z.uuid("Invalid origin account"),
        toId: z.uuid("Invalid destination account"),
        amountCents: positiveMoneyCentsSchema,
        description: z.string().trim().max(255).optional(),
        date: civilDateSchema.optional(),
    })
    .refine((data) => data.fromId !== data.toId, {
        message: "Cannot transfer to the same account",
        path: ["toId"],
    });

export const updateAccountSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(ACCOUNT_TYPES, { message: "Invalid type" }),
    initialBalanceCents: z.coerce.number().pipe(moneyCentsSchema).default(0),
    initialBalanceDate: civilDateSchema.optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export type TransferInput = z.infer<typeof transferSchema>;
