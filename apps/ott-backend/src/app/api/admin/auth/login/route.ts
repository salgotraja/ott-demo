import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const COOKIE_NAME = "admin_token";

function buildRedirectUrl(req: NextRequest, path: string): URL {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? `localhost:${process.env.PORT ?? "3001"}`;
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return new URL(path, `${proto}://${host}`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let username: string | undefined;
  let password: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: { username?: string; password?: string };
    try {
      body = (await req.json()) as { username?: string; password?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    username = body.username;
    password = body.password;
  } else {
    const form = await req.formData();
    username = form.get("username") as string;
    password = form.get("password") as string;
  }

  if (!username || !password) {
    return NextResponse.redirect(buildRedirectUrl(req, "/admin/login?error=1"));
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!expectedUsername || !expectedHash || !jwtSecret) {
    console.error("Admin credentials or JWT_SECRET not configured");
    return NextResponse.redirect(buildRedirectUrl(req, "/admin/login?error=1"));
  }

  const usernameMatch = username === expectedUsername;
  const passwordMatch = await bcrypt.compare(password, expectedHash);

  if (!usernameMatch || !passwordMatch) {
    return NextResponse.redirect(buildRedirectUrl(req, "/admin/login?error=1"));
  }

  const expirySeconds = parseInt(process.env.JWT_EXPIRY_SECONDS ?? "28800", 10);
  const secret = new TextEncoder().encode(jwtSecret);

  const token = await new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expirySeconds}s`)
    .sign(secret);

  const res = NextResponse.redirect(buildRedirectUrl(req, "/admin/movies"));
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: expirySeconds,
    path: "/",
  });
  return res;
}
