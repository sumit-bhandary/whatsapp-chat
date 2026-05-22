import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/sign-up", "/auth/forgot-password", "/auth/confirm", "/auth/update-password"];
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token"];

export async function proxy(_request: NextRequest) {
  // Temporary bypass: allow all requests through to help diagnose the
  // deployment 404. Remove this change after debugging and restore the
  // auth guard.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|api/webhook$).*)",
  ],
};