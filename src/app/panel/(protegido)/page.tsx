import { PanelNav } from "@/components/panel/PanelNav";
import { PanelBoard } from "@/components/panel/PanelBoard";
import { getPanelOrders } from "@/features/orders/panel";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos" };

/** F3-12 · Panel de pedidos: solo personal con rol (staff_roles). */
export default async function PanelPage() {
  const session = await requireStaff("pedidos");
  const orders = await getPanelOrders();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="pedidos" email={session.email} role={session.role} />
      <PanelBoard initialOrders={orders} />
    </main>
  );
}
