import { z } from "zod";

export const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit"] as const;

export const createAccountSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(ACCOUNT_TYPES, { message: "Invalid type" }),
    initialBalanceCents: z.coerce
        .number()
        .int("Invalid value")
        .default(0),
});

export type CreateAccountInput = Omit<z.infer<typeof createAccountSchema>, "initialBalanceCents"> & {
    initialBalanceCents?: number;
};


export const transferSchema = z
    .object({
        fromId: z.uuid("Invalid origin account"),
        toId: z.uuid("Invalid destination account"),
        amountCents: z
            .number()
            .int("Value must be in cents")
            .positive("Value must be greater than zero"),
        description: z.string().trim().max(255).optional(),
        date: z.coerce.date().optional(),
    })
    .refine((data) => data.fromId !== data.toId, {
        message: "Cannot transfer to the same account",
        path: ["toId"],
    });

export type TransferInput = z.infer<typeof transferSchema>;
