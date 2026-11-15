import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { readPublicEnv } from "@/lib/env";

/**
 * Refresca la sesión del personal en cada petición al panel.
 * `auth.getUser()` valida el token con Supabase y, si venció, escribe las cookies nuevas.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = readPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // No meter código entre createServerClient y getUser: rompe el refresco de sesión.
  await supabase.auth.getUser();

  return response;
}
