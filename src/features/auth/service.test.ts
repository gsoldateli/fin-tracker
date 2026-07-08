import { describe, it, expect, beforeEach } from "vitest";

import { users } from "@/src/db/schema";
import { createTestDb } from "@/tests/helpers/db";

import { findOrCreateUser } from "./service";

describe("findOrCreateUser", () => {
    let db: Awaited<ReturnType<typeof createTestDb>>;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("cadastra um novo usuário quando o e-mail não existe", async () => {
        const user = await findOrCreateUser(db, "novo@test.com");

        expect(user.id).toBeDefined();
        expect(user.email).toBe("novo@test.com");

        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1); // created exactly one
    });

    it("retorna o usuário existente sem criar duplicata (login)", async () => {
        const primeiro = await findOrCreateUser(db, "recorrente@test.com");
        const segundo = await findOrCreateUser(db, "recorrente@test.com");

        expect(segundo.id).toBe(primeiro.id); // same user
        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1); // didn't duplicate
    });

    it("preserva o createdAt original no login subsequente", async () => {
        const primeiro = await findOrCreateUser(db, "estavel@test.com");
        const segundo = await findOrCreateUser(db, "estavel@test.com");

        // upsert cannot "reset" the creation date on each login
        expect(segundo.createdAt.getTime()).toBe(primeiro.createdAt.getTime());
    });

    it("trata chamadas concorrentes com o mesmo e-mail sem quebrar", async () => {
        // two simultaneous submissions — atomic upsert resolves the race
        const [a, b] = await Promise.all([
            findOrCreateUser(db, "corrida@test.com"),
            findOrCreateUser(db, "corrida@test.com"),
        ]);

        expect(a.id).toBe(b.id);
        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1);
    });
});