import { PanelNav } from "@/components/panel/PanelNav";
import { StaffManager } from "@/components/panel/StaffManager";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personal" };

/**
 * Módulo 1 · Personal. Solo administración. Por ahora existe con datos de ejemplo (modo
 * demostración); en el panel real la sección está oculta hasta tener su backend (B-R1).
 */
export default async function PanelStaffPage() {
  const session = await requireStaff("personal");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav
        current="personal"
        email={session.email}
        role={session.role}
        demo={session.isDemo}
      />
      <StaffManager currentEmail={session.email} />
    </main>
  );
}
