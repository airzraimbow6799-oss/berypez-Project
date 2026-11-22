import { redirect } from "next/navigation";

import { homeFor } from "@/features/staff/roles";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";

/**
 * Entrada del panel: lleva a cada rol a su primera sección. Administración entra a su Resumen
 * (o a Pedidos en el panel real, mientras el Resumen solo exista en la demostración);
 * Recepción, a las Reservas.
 */
export default async function PanelHome() {
  const session = await requireStaff();
  redirect(homeFor(session.role, session.isDemo)?.href ?? "/panel/sin-acceso");
}
