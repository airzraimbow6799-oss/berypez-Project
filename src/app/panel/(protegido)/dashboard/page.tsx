import { DashboardView } from "@/components/panel/DashboardView";
import { PanelNav } from "@/components/panel/PanelNav";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumen" };

/**
 * Módulo 6 · Dashboard. Solo administración. Por ahora existe con datos de ejemplo (modo
 * demostración); en el panel real la sección está oculta hasta tener su backend.
 */
export default async function PanelDashboardPage() {
  const session = await requireStaff("dashboard");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav
        current="dashboard"
        email={session.email}
        role={session.role}
        demo={session.isDemo}
      />
      <DashboardView />
    </main>
  );
}
