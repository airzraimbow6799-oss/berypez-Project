import "server-only";

import { createClient } from "@supabase/supabase-js";

import { parseServerEnv } from "@/lib/env";

/**
 * Cliente con la clave SECRETA: salta RLS. Solo para `/api/*` (crear pedidos con el
 * precio recalculado, registrar pagos y reclamos) y scripts del servidor.
 * `server-only` hace fallar el build si se importa desde código del navegador.
 */
export function createServiceClient() {
  const env = parseServerEnv(process.env);
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
