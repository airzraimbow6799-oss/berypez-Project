import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { readPublicEnv } from "@/lib/env";

/**
 * Refresca la sesión del personal en cada petición al panel.
 *
 * - Sin cookies de sesión (quien aún no ingresó, o la demostración) no hay nada que refrescar:
 *   no se crea el cliente ni se consulta a Supabase.
 * - Con cookies, `auth.getClaims()` comprueba la firma del token **en el servidor, con las
 *   claves públicas del proyecto**, sin viajar a Supabase; solo renueva (y escribe las cookies
 *   nuevas) si el token venció. Este proyecto firma con claves asimétricas (ES256).
 *
 * Esto es solo el refresco de cookies. La decisión de quién entra y con qué rol sigue en
 * `getStaffSession`, que valida con `auth.getUser()` y consulta `staff_roles`.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))) {
    return NextResponse.next({ request });
  }

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

  // No meter código entre createServerClient y getClaims: rompe el refresco de sesión.
  await supabase.auth.getClaims();

  return response;
}
