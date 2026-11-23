import { type NextRequest, NextResponse } from "next/server";

import { DEMO_COOKIE } from "@/features/demo/config";
import { updateSession } from "@/lib/supabase/middleware";

/** Páginas del panel que piden sesión (el ingreso y las rutas de API no se redirigen). */
const isProtectedPanelPage = (pathname: string) =>
  pathname.startsWith("/panel") && !pathname.startsWith("/panel/ingresar");

const hasSessionCookie = (request: NextRequest) =>
  request.cookies.getAll().some((c) => c.name.startsWith("sb-") || c.name === DEMO_COOKIE);

export function middleware(request: NextRequest) {
  // Sin ninguna cookie de sesión no hace falta ni armar la página: se manda al ingreso con un
  // 307 de verdad (con la pantalla de carga, la redirección de la página saldría con 200).
  // Esto es solo comodidad y velocidad: quien decide el acceso sigue siendo `requireStaff`.
  if (isProtectedPanelPage(request.nextUrl.pathname) && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/panel/ingresar", request.url));
  }
  return updateSession(request);
}

// Solo el panel usa sesión. Las páginas públicas (carta, checkout) no pasan por Auth
// para no sumar latencia.
export const config = {
  matcher: ["/panel/:path*", "/api/admin/:path*"],
};
