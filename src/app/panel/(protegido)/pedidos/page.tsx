import { DemoOrders } from "@/components/panel/DemoBoards";
import { PanelBoard } from "@/components/panel/PanelBoard";
import { PanelNav } from "@/components/panel/PanelNav";
import { getPanelOrders } from "@/features/orders/panel";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos" };

/** F3-12 · Panel de pedidos: solo personal con rol (staff_roles). */
export default async function PanelPage() {
  const session = await requireStaff("pedidos");
  // Modo demostración: los pedidos son de ejemplo y viven en el navegador, sin tocar Supabase.
  const orders = session.isDemo ? [] : await getPanelOrders();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="pedidos" email={session.email} role={session.role} demo={session.isDemo} />
      {session.isDemo ? <DemoOrders /> : <PanelBoard initialOrders={orders} />}
    </main>
  );
}
