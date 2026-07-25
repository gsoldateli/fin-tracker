import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSecret } from "./src/lib/session";

const secret = getSecret();

export async function proxy(req: NextRequest) {
    const token = req.cookies.get("session")?.value;
    try {
        if (!token) throw new Error();
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/((?!login|api/health|_next/static|_next/image|favicon.ico|static|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm)$|$).*)"],
};