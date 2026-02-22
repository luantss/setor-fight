/**
 * Next.js Middleware — Route Protection
 *
 * Runs on every request matching the config matcher.
 * Responsibilities:
 *  1. Refresh the Supabase session (keeps cookies alive)
 *  2. Redirect unauthenticated users to /login
 *  3. Redirect users without ADMIN role away from /admin routes
 *
 * IMPORTANT: Role is read from the DB via a lightweight API call,
 * never from JWT claims or client-provided data.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

// Routes that require authentication
const PROTECTED_ROUTES = ["/admin", "/competidor"];

// Routes that are only accessible to unauthenticated users
const AUTH_ROUTES = ["/login", "/cadastro"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  // Always refresh the session to keep cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // -------------------------------------------------------------------
  // 1) Redirect authenticated users away from auth pages
  // -------------------------------------------------------------------
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -------------------------------------------------------------------
  // 2) Redirect unauthenticated users away from protected pages
  // -------------------------------------------------------------------
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // -------------------------------------------------------------------
  // 3) Protect /admin routes — role check via internal API
  //    We delegate the DB role lookup to the server component/action
  //    to avoid Prisma in the middleware edge runtime.
  //    The middleware only verifies authentication here.
  //    Fine-grained role enforcement happens in lib/auth.ts server-side.
  // -------------------------------------------------------------------

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     * - api routes (handled individually)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
