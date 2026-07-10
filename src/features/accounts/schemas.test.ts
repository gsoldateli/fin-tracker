import { describe, it, expect } from "vitest";
import { createAccountSchema } from "./schemas";

describe("createAccountSchema", () => {
    it("accepts valid input with default initialBalanceCents", () => {
        const result = createAccountSchema.safeParse({
            name: "Main Checking",
            type: "checking",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.initialBalanceCents).toBe(0);
        }
    });

    it("rejects empty name", () => {
        const result = createAccountSchema.safeParse({
            name: "",
            type: "checking",
        });
        expect(result.success).toBe(false);
    });

    it("rejects name over 100 characters", () => {
        const result = createAccountSchema.safeParse({
            name: "a".repeat(101),
            type: "checking",
        });
        expect(result.success).toBe(false);
    });

    it("trims whitespace from name", () => {
        const result = createAccountSchema.safeParse({
            name: "  My Account  ",
            type: "checking",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("My Account");
        }
    });

    it("rejects invalid account type", () => {
        const result = createAccountSchema.safeParse({
            name: "Test",
            type: "investment",
        });
        expect(result.success).toBe(false);
    });

    it("accepts all valid account types", () => {
        for (const type of ["checking", "savings", "cash", "credit"]) {
            const result = createAccountSchema.safeParse({ name: "Test", type });
            expect(result.success).toBe(true);
        }
    });

    it("coerces string initialBalanceCents to number", () => {
        const result = createAccountSchema.safeParse({
            name: "Test",
            type: "checking",
            initialBalanceCents: "5000",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.initialBalanceCents).toBe(5000);
        }
    });

    it("rejects non-integer initialBalanceCents", () => {
        const result = createAccountSchema.safeParse({
            name: "Test",
            type: "checking",
            initialBalanceCents: 10.5,
        });
        expect(result.success).toBe(false);
    });

    it("defaults initialBalanceCents to 0 when not provided", () => {
        const result = createAccountSchema.safeParse({
            name: "Test",
            type: "savings",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.initialBalanceCents).toBe(0);
        }
    });
});
