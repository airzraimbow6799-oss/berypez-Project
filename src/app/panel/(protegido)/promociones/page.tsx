import { PanelNav } from "@/components/panel/PanelNav";
import { DemoPromotionsManager } from "@/components/panel/promociones/DemoPromotionsManager";
import { LivePromotionsManager } from "@/components/panel/promociones/LivePromotionsManager";
import { listDishes } from "@/features/carta/server";
import { listPromotions } from "@/features/promotions/server";
import { requireStaff } from "@/features/staff/session";
import { readPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promociones" };

/** Promociones (solo Administración): real en Supabase o de ejemplo en el modo demostración. */
export default async function PanelPromocionesPage() {
  const session = await requireStaff("promociones");

  let live: React.ReactNode = null;
  if (!session.isDemo) {
    const client = await createClient();
    const supabaseUrl = readPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
    const [promotions, dishes] = await Promise.all([
      listPromotions(client, supabaseUrl),
      listDishes(client, supabaseUrl),
    ]);
    live = <LivePromotionsManager initialPromotions={promotions} initialDishes={dishes} />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav
        current="promociones"
        email={session.email}
        role={session.role}
        demo={session.isDemo}
      />
      {session.isDemo ? <DemoPromotionsManager /> : live}
    </main>
  );
}
