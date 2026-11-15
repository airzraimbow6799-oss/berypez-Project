import { createBrowserClient } from "@supabase/ssr";

import { readPublicEnv } from "@/lib/env";

/** Cliente del navegador: clave publishable, todo pasa por RLS. */
export function createClient() {
  const env = readPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
