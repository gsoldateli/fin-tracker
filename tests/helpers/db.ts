import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";

export async function createTestDb() {
    const db = drizzle({
        connection: {
            url: ":memory:",
        }
    });

    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../src/drizzle") });

    return db;
}