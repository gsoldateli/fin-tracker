// tests/helpers/db.ts
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import { unlink } from "node:fs/promises";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export async function createTestDb() {
    const tmpPath = join(tmpdir(), `fintracker-test-${randomUUID()}.db`);
    const client = createClient({ url: `file:${tmpPath}` });
    const db = drizzle({ client });

    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });

    return {
        db,
        async cleanup() {
            client.close();
            await unlink(tmpPath).catch(() => { });
        },
    };
}