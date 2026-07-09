import { describe, it, expect } from "vitest";
import { loginSchema } from "./schemas";

describe("loginSchema", () => {
    it("normaliza e-mail para lowercase e remove espaços", () => {
        const result = loginSchema.parse({ email: "  Foo@Bar.COM " });
        expect(result.email).toBe("foo@bar.com");
    });

    it.each(["", "não-é-email", "a@", "@b.com", "sem-arroba.com"])(
        "rejeita e-mail inválido: '%s'",
        (email) => {
            expect(loginSchema.safeParse({ email }).success).toBe(false);
        }
    );

    it("rejeita e-mail acima de 255 caracteres", () => {
        const huge = "a".repeat(250) + "@x.com";
        expect(loginSchema.safeParse({ email: huge }).success).toBe(false);
    });
});