/**
 * F2-03 / F2-05 · Horario de atención por sede, siempre en hora de Lima (UTC−5, sin horario
 * de verano), sin importar en qué zona horaria corra el servidor.
 */
import { z } from "zod";

export const TIME_ZONE = "America/Lima";

const slotSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/),
});

export type OpeningSlot = z.infer<typeof slotSchema>;
export type OpeningHours = OpeningSlot[];

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Valida el JSON guardado en `branches.opening_hours`; ignora los tramos inválidos. */
export function parseOpeningHours(value: unknown): OpeningHours {
  if (!Array.isArray(value)) return [];
  return value.flatMap((slot) => {
    const parsed = slotSchema.safeParse(slot);
    return parsed.success ? [parsed.data] : [];
  });
}

const minutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Día de la semana (0 = domingo) y minutos desde medianoche, en Lima. */
export function limaClock(date: Date): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function isWithinHours(hours: OpeningHours, date: Date): boolean {
  const { day, minute } = limaClock(date);
  return hours.some(
    (slot) => slot.day === day && minute >= minutes(slot.open) && minute < minutes(slot.close),
  );
}

export type BranchStatus = { isOpen: boolean; label: string };

export function branchStatus(hours: OpeningHours, now: Date): BranchStatus {
  if (hours.length === 0) {
    return { isOpen: false, label: "Horario por confirmar" };
  }
  const { day, minute } = limaClock(now);
  const today = hours
    .filter((s) => s.day === day)
    .sort((a, b) => minutes(a.open) - minutes(b.open));

  const current = today.find((s) => minute >= minutes(s.open) && minute < minutes(s.close));
  if (current) {
    return { isOpen: true, label: `Abierto · cierra a las ${current.close}` };
  }

  const laterToday = today.find((s) => minutes(s.open) > minute);
  if (laterToday) {
    return { isOpen: false, label: `Cerrado · abre hoy a las ${laterToday.open}` };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = (day + offset) % 7;
    const first = hours
      .filter((s) => s.day === nextDay)
      .sort((a, b) => minutes(a.open) - minutes(b.open))[0];
    if (first) {
      const when = offset === 1 ? "mañana" : `el ${DAY_NAMES[nextDay]}`;
      return { isOpen: false, label: `Cerrado · abre ${when} a las ${first.open}` };
    }
  }
  return { isOpen: false, label: "Horario por confirmar" };
}
