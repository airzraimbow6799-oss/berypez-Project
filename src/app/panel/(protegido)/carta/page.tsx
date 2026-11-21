import { CartaManager } from "@/components/panel/CartaManager";
import { PanelNav } from "@/components/panel/PanelNav";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carta" };

/**
 * Módulo 2 · Carta administrable. Por ahora solo existe con datos de ejemplo (modo
 * demostración); en el panel real la sección está oculta hasta tener su backend.
 */
export default async function PanelCartaPage() {
  const session = await requireStaff("carta");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="carta" email={session.email} role={session.role} demo={session.isDemo} />
      <CartaManager role={session.role} />
    </main>
  );
}
