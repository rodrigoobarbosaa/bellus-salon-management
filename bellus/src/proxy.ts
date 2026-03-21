import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Redirecionar / para /dashboard (autenticado) ou /login (não autenticado)
  if (pathname === "/") {
    const redirectUrl = user ? new URL("/dashboard", request.url) : new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Proteger rotas /dashboard — redirecionar não-autenticados para /login
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirecionar autenticados que tentam acessar /login para /dashboard
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
