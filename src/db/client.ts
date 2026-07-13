import { drizzle } from "drizzle-orm/libsql";
export type Database = ReturnType<typeof drizzle>;

let _db: Database | null = null;

export function getDb() {
    if (_db) return _db;

    const url = process.env.TURSO_CONNECTION_URL;


    if (!url) {
        throw new Error("TURSO_CONNECTION_URL is not set");
    }

    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!authToken) {
        throw new Error("TURSO_AUTH_TOKEN is not set");
    }

    _db = drizzle({
        connection: {
            url: url!,
            authToken: authToken!,
        }
    });
    return _db;
}