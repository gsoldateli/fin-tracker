import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";


export function getSecret() {
    const raw = process.env.SESSION_SECRET;
    if (!raw || raw.length < 32) {
        throw new Error("SESSION_SECRET is missing or too short (minimum 32 characters)");
    }
    return new TextEncoder().encode(raw);
}

const COOKIE = "session";

export async function createSession(userId: string) {
    const token = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(getSecret());

    (await cookies()).set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });
}

export async function getSession(): Promise<{ userId: string } | null> {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return { userId: payload.sub as string };
    } catch {
        return null;
    }
}

export async function destroySession() {
    (await cookies()).delete(COOKIE);
}