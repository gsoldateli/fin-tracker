import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email").max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;