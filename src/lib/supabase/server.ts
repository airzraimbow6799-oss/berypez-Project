import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readPublicEnv } from "@/lib/env";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Usa la sesión del usuario (cookies) y la clave publishable: respeta RLS.
 */
export async function createClient() {
  const env = readPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component: no puede escribir cookies.
            // El middleware ya refresca la sesión en las rutas del panel.
          }
        },
      },
    },
  );
}
