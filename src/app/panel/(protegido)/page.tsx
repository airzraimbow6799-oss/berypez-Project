import { redirect } from "next/navigation";

import { PanelNav } from "@/components/panel/PanelNav";
import { PanelBoard } from "@/components/panel/PanelBoard";
import { getPanelOrders, getStaffSession } from "@/features/orders/panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos" };

/** F3-12 · Panel de pedidos: solo personal con rol (staff_roles). */
export default async function PanelPage() {
  const session = await getStaffSession();
  if (!session) redirect("/panel/ingresar");
  const orders = await getPanelOrders();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="pedidos" email={session.email} />
      <PanelBoard initialOrders={orders} />
    </main>
  );
}
