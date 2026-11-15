import { createClient } from "@supabase/supabase-js";

import { readPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente de solo lectura pública (carta, sedes, zonas): clave publishable, sin cookies
 * ni sesión. Al no leer cookies, las páginas que lo usan pueden ser estáticas (ISR).
 */
export function createPublicClient() {
  const env = readPublicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
