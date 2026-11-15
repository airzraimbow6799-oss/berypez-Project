/** F4-01 · Franjas de reserva de 30 min según horario, aforo y anticipación (hora de Lima). */
import type { OpeningHours } from "@/features/checkout/hours";

export const SLOT_MINUTES = 30;
/** Última franja: una hora antes del cierre. */
export const LAST_SEATING_BEFORE_CLOSE = 60;
/** Mínimo de anticipación para reservar. */
export const MIN_LEAD_MINUTES = 60;
export const LIMA_OFFSET = "-05:00";

export type Slot = { time: string; startsAt: string; available: boolean; seatsLeft: number };

const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Día de la semana (0 = domingo) de una fecha YYYY-MM-DD en Lima. */
function weekday(date: string): number {
  return new Date(`${date}T12:00:00${LIMA_OFFSET}`).getUTCDay();
}

/** Cualquier fecha/hora → ISO en hora de Lima ("2026-11-20T13:00:00-05:00"). */
export function toLimaIso(value: string | Date): string {
  // Postgres escribe "2026-11-20 18:00:00+00": JavaScript necesita "T" y "+00:00".
  const date =
    typeof value === "string"
      ? new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"))
      : value;
  const lima = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return `${lima.toISOString().slice(0, 19)}${LIMA_OFFSET}`;
}

export function limaDayRange(date: string): { from: string; to: string } {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDate = next.toISOString().slice(0, 10);
  return { from: `${date}T00:00:00${LIMA_OFFSET}`, to: `${nextDate}T00:00:00${LIMA_OFFSET}` };
}

type BuildSlotsInput = {
  date: string;
  hours: OpeningHours;
  capacity: number;
  /** Personas ya reservadas por franja (clave: ISO con −05:00). */
  reserved: ReadonlyMap<string, number>;
  partySize: number;
  now: Date;
  isBlocked?: boolean;
};

export function buildSlots({
  date,
  hours,
  capacity,
  reserved,
  partySize,
  now,
  isBlocked = false,
}: BuildSlotsInput): Slot[] {
  if (isBlocked) return [];
  const day = weekday(date);
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;

  return hours
    .filter((slot) => slot.day === day)
    .flatMap((slot) => {
      const times: Slot[] = [];
      const last = toMinutes(slot.close) - LAST_SEATING_BEFORE_CLOSE;
      for (let m = toMinutes(slot.open); m <= last; m += SLOT_MINUTES) {
        const time = toHHMM(m);
        const startsAt = `${date}T${time}:00${LIMA_OFFSET}`;
        const seatsLeft = Math.max(0, capacity - (reserved.get(startsAt) ?? 0));
        const isFuture = new Date(startsAt).getTime() >= earliest;
        times.push({ time, startsAt, seatsLeft, available: isFuture && seatsLeft >= partySize });
      }
      return times;
    });
}
