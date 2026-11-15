import "server-only";

import { parseOpeningHours } from "@/features/checkout/hours";
import { createServiceClient } from "@/lib/supabase/service";

import { limaDayRange, toLimaIso } from "./availability";

export async function getBranchForReservations(slug: string) {
  const { data } = await createServiceClient()
    .from("branches")
    .select("id, slug, name, whatsapp, opening_hours, seats_per_slot")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    whatsapp: /^\d{9,15}$/.test(data.whatsapp) ? data.whatsapp : null,
    openingHours: parseOpeningHours(data.opening_hours),
    capacity: data.seats_per_slot,
  };
}

export async function getReservedSeats(
  branchId: number,
  date: string,
): Promise<Map<string, number>> {
  const { from, to } = limaDayRange(date);
  const { data, error } = await createServiceClient().rpc("reservations_reserved_seats", {
    p_branch: branchId,
    p_from: from,
    p_to: to,
  });
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [toLimaIso(row.starts_at), row.seats]));
}

export async function isBlocked(branchId: number, date: string): Promise<boolean> {
  const { data } = await createServiceClient()
    .from("blocked_dates")
    .select("day")
    .eq("branch_id", branchId)
    .eq("day", date)
    .maybeSingle();
  return data !== null;
}

export async function createReservation(input: Record<string, string | number | null>) {
  const { data, error } = await createServiceClient().rpc("reservations_create", { p: input });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) throw new Error(error?.message ?? "No se creó la reserva");
  return { reservationId: row.reservation_id, manageToken: row.manage_token };
}

export async function getReservationByToken(token: string) {
  const { data, error } = await createServiceClient()
    .from("reservations")
    .select(
      "id, starts_at, party_size, area, occasion, customer_name, status, branches(name, slug)",
    )
    .eq("manage_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Cancela con el enlace secreto. Solo reservas confirmadas y futuras. */
export async function cancelReservation(
  token: string,
): Promise<"ok" | "not_found" | "not_cancellable"> {
  const reservation = await getReservationByToken(token);
  if (!reservation) return "not_found";
  if (
    reservation.status !== "confirmed" ||
    new Date(reservation.starts_at).getTime() < Date.now()
  ) {
    return "not_cancellable";
  }
  const { error } = await createServiceClient()
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("manage_token", token);
  if (error) throw new Error(error.message);
  return "ok";
}
