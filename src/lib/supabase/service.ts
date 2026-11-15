import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente con la clave SECRETA: salta RLS. Solo para `/api/*` (crear pedidos con el
 * precio recalculado, registrar pagos y reclamos) y scripts del servidor.
 * `server-only` hace fallar el build si se importa desde código del navegador.
 * Valida solo lo que usa: no depende de que Resend o Turnstile estén configurados.
 */
export function createServiceClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!secret || secret.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SECRET_KEY no está configurada o no es la clave secreta.");
  }
  return createClient<Database>(readPublicEnv().NEXT_PUBLIC_SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
