import { DemoCartaManager } from "@/components/panel/carta/DemoCartaManager";
import { LiveCartaManager } from "@/components/panel/carta/LiveCartaManager";
import { PanelNav } from "@/components/panel/PanelNav";
import { listDishes } from "@/features/carta/server";
import { requireStaff } from "@/features/staff/session";
import { readPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carta" };

/**
 * Módulo 2 · Carta administrable (solo Administración).
 * - Sesión real: lee y guarda en Supabase; la web pública se actualiza al guardar.
 * - Modo demostración: datos de ejemplo en el navegador, nunca toca la base.
 */
export default async function PanelCartaPage() {
  const session = await requireStaff("carta");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="carta" email={session.email} role={session.role} demo={session.isDemo} />
      {session.isDemo ? (
        <DemoCartaManager role={session.role} />
      ) : (
        <LiveCartaManager
          role={session.role}
          initialDishes={await listDishes(
            await createClient(),
            readPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
          )}
        />
      )}
    </main>
  );
}
