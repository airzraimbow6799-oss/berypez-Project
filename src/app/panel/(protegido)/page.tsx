import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand/BrandLogo";
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo className="text-marino h-8 w-auto" />
          <h1 className="font-sans text-xl font-semibold">Pedidos</h1>
        </div>
        <p className="text-tinta-suave text-sm">
          {session.email} · {session.role === "admin" ? "Administración" : "Cocina"}
        </p>
      </header>
      <PanelBoard initialOrders={orders} />
    </main>
  );
}
