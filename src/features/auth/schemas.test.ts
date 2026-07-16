import { describe, it, expect } from "vitest";
import { loginSchema } from "./schemas";

describe("loginSchema", () => {
    it("normalizes email to lowercase and removes spaces", () => {
        const result = loginSchema.parse({ email: "  Foo@Bar.COM " });
        expect(result.email).toBe("foo@bar.com");
    });

    it.each(["", "not-an-email", "a@", "@b.com", "missing-at.com"])(
        "rejects invalid email: '%s'",
        (email) => {
            expect(loginSchema.safeParse({ email }).success).toBe(false);
        }
    );

    it("rejects email longer than 255 characters", () => {
        const huge = "a".repeat(250) + "@x.com";
        expect(loginSchema.safeParse({ email: huge }).success).toBe(false);
    });
});