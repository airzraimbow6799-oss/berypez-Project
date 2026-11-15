/**
 * F4-05 · Lógica pura de la pasarela de reservas (pasos, calendario, franjas y formatos).
 * Sin Intl: los textos salen iguales en cualquier navegador y en los tests.
 */

export const WIZARD_STEPS = [
  { id: "sede", label: "Sede", question: "¿En qué sede te esperamos?" },
  { id: "fecha", label: "Día y hora", question: "¿Qué día y a qué hora?" },
  { id: "datos", label: "Tus datos", question: "¿A nombre de quién reservamos?" },
  { id: "resumen", label: "Confirmar", question: "Revisa y confirma tu reserva" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-11-21" → fecha UTC al mediodía (evita saltos de día por zona horaria). */
function parseDay(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseDay(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** "sábado 21 de noviembre" */
export function formatLongDate(iso: string): string {
  const date = parseDay(iso);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]}`;
}

/** "noviembre 2026" */
export function formatMonth(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

/** "13:30" → "1:30 p. m." (como se dice en Perú). */
export function formatTime12(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "a. m." : "p. m.";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export type CalendarDay = { iso: string; day: number; isSelectable: boolean };

/**
 * Semanas del mes (lunes a domingo). Los huecos antes del día 1 y después del último
 * son null. Solo se puede elegir entre `minIso` y `maxIso` (incluidos).
 */
export function monthGrid(
  year: number,
  month: number,
  minIso: string,
  maxIso: string,
): Array<Array<CalendarDay | null>> {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7; // lunes = 0
  const cells: Array<CalendarDay | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIso(new Date(Date.UTC(year, month, day, 12)));
    cells.push({ iso, day, isSelectable: iso >= minIso && iso <= maxIso });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<CalendarDay | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Mes (año, 0-11) de una fecha ISO. */
export function monthOf(iso: string): { year: number; month: number } {
  const date = parseDay(iso);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/** ¿El mes (year, month) tiene algún día dentro del rango? Para habilitar las flechas. */
export function monthHasDays(year: number, month: number, minIso: string, maxIso: string): boolean {
  const first = toIso(new Date(Date.UTC(year, month, 1, 12)));
  const last = toIso(new Date(Date.UTC(year, month + 1, 0, 12)));
  return last >= minIso && first <= maxIso;
}

export type SlotLike = { time: string; available: boolean };
export type SlotGroup<T extends SlotLike> = { id: string; label: string; slots: T[] };

/** Agrupa las horas en momentos del día que cualquiera entiende. Omite grupos vacíos. */
export function groupSlots<T extends SlotLike>(slots: readonly T[]): Array<SlotGroup<T>> {
  const groups: Array<SlotGroup<T>> = [
    { id: "almuerzo", label: "Almuerzo", slots: [] },
    { id: "tarde", label: "Tarde", slots: [] },
    { id: "noche", label: "Noche", slots: [] },
  ];
  for (const slot of slots) {
    const hour = Number(slot.time.slice(0, 2));
    const group = hour < 15 ? groups[0] : hour < 19 ? groups[1] : groups[2];
    group?.slots.push(slot);
  }
  return groups.filter((g) => g.slots.length > 0);
}

/** Paso al que hay que volver según el campo con error que devuelve el servidor. */
export function stepForField(field: string): WizardStepId {
  if (field === "branchSlug" || field === "partySize") return "sede";
  if (field === "date" || field === "time") return "fecha";
  if (field === "turnstileToken") return "resumen";
  return "datos";
}
