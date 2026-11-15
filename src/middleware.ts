import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

// Solo el panel usa sesión. Las páginas públicas (carta, checkout) no pasan por Auth
// para no sumar latencia.
export const config = {
  matcher: ["/panel/:path*", "/api/admin/:path*"],
};
