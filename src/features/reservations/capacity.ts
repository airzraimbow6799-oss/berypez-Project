/**
 * Cupo de reservas por franja y por zona (módulo 3, «Reservas centralizadas»).
 *
 * Regla del local: toda reserva (web, llamada o WhatsApp) cuenta igual. Cada franja de 30
 * minutos tiene un aforo de personas y un límite de reservas de terraza; cuando la terraza se
 * llena, esa opción se bloquea para esa hora. Aquí vive la lógica pura; el backend real
 * (B-A1) aplica la misma regla dentro de la transacción de `reservations_create`.
 */

export const SLOT_MINUTES = 30;
export const MAX_PARTY_SIZE = 20;
/** Antelación mínima para reservar (igual que la web). */
export const LEAD_MINUTES = 60;

export type ReservationArea = "interior" | "terraza";
export type AreaChoice = ReservationArea | "cualquiera";

/** Cupo de ejemplo. Los valores reales los define el local (ver agenda de la reunión 1). */
export const DEMO_CAPACITY = {
  seatsPerSlot: 40,
  terraceMaxParties: 2,
  firstSlot: "12:00",
  lastSlot: "21:30",
} as const;

export type SlotReservation = {
  startsAt: string;
  partySize: number;
  area: string | null;
  status: string;
  branch: string;
};

const LIMA = "America/Lima";

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: LIMA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: LIMA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** «2026-11-21» en hora de Lima. */
export const dateKeyLima = (iso: string | number | Date): string => dateFmt.format(new Date(iso));

/** Franja de 30 minutos a la que pertenece una hora: 19:47 → «19:30». */
export function slotOf(iso: string | number | Date): string {
  const [h = "00", m = "00"] = timeFmt.format(new Date(iso)).split(":");
  return `${h}:${Number(m) < SLOT_MINUTES ? "00" : "30"}`;
}

/** Instante de inicio de una franja: «2026-11-21» + «19:30» (Lima, UTC-5 sin cambio de hora). */
export function slotStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-05:00`);
}

/** Todas las franjas del día: 12:00, 12:30 … 21:30. */
export function slotTimes(): string[] {
  const [firstH = 12] = DEMO_CAPACITY.firstSlot.split(":").map(Number);
  const [lastH = 21] = DEMO_CAPACITY.lastSlot.split(":").map(Number);
  const times: string[] = [];
  for (let h = firstH; h <= lastH; h += 1) {
    times.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  }
  return times;
}

/** Las reservas canceladas o que no llegaron liberan el cupo. */
const holdsCapacity = (r: SlotReservation) => r.status === "confirmed" || r.status === "arrived";

export type SlotCounts = { seats: number; parties: number; terraceParties: number };

export function countsAt(
  reservations: readonly SlotReservation[],
  branch: string,
  date: string,
  time: string,
): SlotCounts {
  const counts: SlotCounts = { seats: 0, parties: 0, terraceParties: 0 };
  for (const r of reservations) {
    if (r.branch !== branch || !holdsCapacity(r)) continue;
    if (dateKeyLima(r.startsAt) !== date || slotOf(r.startsAt) !== time) continue;
    counts.seats += r.partySize;
    counts.parties += 1;
    if (r.area === "terraza") counts.terraceParties += 1;
  }
  return counts;
}

export type Unavailable = "past" | "too_big" | "full" | "terrace_full";
export type SlotCheck = { ok: true } | { ok: false; reason: Unavailable };

export type SlotQuery = {
  branch: string;
  date: string;
  time: string;
  partySize: number;
  area: AreaChoice;
  now: number;
};

export function checkSlot(reservations: readonly SlotReservation[], q: SlotQuery): SlotCheck {
  if (q.partySize < 1 || q.partySize > MAX_PARTY_SIZE) return { ok: false, reason: "too_big" };
  if (slotStart(q.date, q.time).getTime() < q.now + LEAD_MINUTES * 60_000) {
    return { ok: false, reason: "past" };
  }
  const counts = countsAt(reservations, q.branch, q.date, q.time);
  if (q.area === "terraza" && counts.terraceParties >= DEMO_CAPACITY.terraceMaxParties) {
    return { ok: false, reason: "terrace_full" };
  }
  if (counts.seats + q.partySize > DEMO_CAPACITY.seatsPerSlot) return { ok: false, reason: "full" };
  return { ok: true };
}

export const UNAVAILABLE_MESSAGES: Record<Unavailable, string> = {
  past: "Esa hora ya pasó o falta menos de una hora. Elige una más tarde.",
  too_big: `Las reservas son de 1 a ${MAX_PARTY_SIZE} personas.`,
  full: "Esa hora está completa. Elige otra.",
  terrace_full: "La terraza está completa a esta hora. Elige interior o «me da igual».",
};

export type SlotState = "libre" | "casi" | "completo" | "pasado";

export type SlotInfo = SlotCounts & {
  time: string;
  state: SlotState;
  terraceFull: boolean;
};

/** Estado de cada franja del día para mostrar libres, casi llenas y completas. */
export function slotsForDay(
  reservations: readonly SlotReservation[],
  branch: string,
  date: string,
  now: number,
): SlotInfo[] {
  return slotTimes().map((time) => {
    const counts = countsAt(reservations, branch, date, time);
    const isPast = slotStart(date, time).getTime() < now + LEAD_MINUTES * 60_000;
    const full = counts.seats >= DEMO_CAPACITY.seatsPerSlot;
    const almost = counts.seats >= DEMO_CAPACITY.seatsPerSlot * 0.75;
    const state: SlotState = isPast ? "pasado" : full ? "completo" : almost ? "casi" : "libre";
    return {
      ...counts,
      time,
      state,
      terraceFull: counts.terraceParties >= DEMO_CAPACITY.terraceMaxParties,
    };
  });
}
