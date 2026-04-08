import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const LOGIN_PATH = "/admin/login";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Allow login page and login API without auth
  if (pathname === LOGIN_PATH || pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  return NextResponse.redirect(loginUrl);
}
