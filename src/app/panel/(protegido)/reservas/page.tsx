import { PanelNav } from "@/components/panel/PanelNav";
import { ReservationsBoard } from "@/components/panel/ReservationsBoard";
import { requireStaff } from "@/features/staff/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservas" };

/** F4-06 · Reservas de hoy y próximos 7 días de la sede del personal (RLS). */
export default async function PanelReservationsPage() {
  const session = await requireStaff("reservas");

  const supabase = await createClient();
  const from = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("reservations")
    .select(
      "id, starts_at, party_size, area, occasion, customer_name, customer_phone, status, branches(name)",
    )
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");

  const reservations = (data ?? []).map((r) => {
    const branch = r.branches as unknown as { name: string } | Array<{ name: string }> | null;
    return {
      id: r.id,
      startsAt: r.starts_at,
      partySize: r.party_size,
      area: r.area,
      occasion: r.occasion,
      name: r.customer_name,
      phone: r.customer_phone,
      status: r.status,
      branch: (Array.isArray(branch) ? branch[0]?.name : branch?.name) ?? "",
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav current="reservas" email={session.email} role={session.role} />
      <ReservationsBoard reservations={reservations} />
    </main>
  );
}
