import { dateKeyLima } from "@/features/reservations/capacity";
import { ORDER_STATUSES, type OrderStatus, STATUS_LABELS } from "@/features/orders/status";

/**
 * Métricas del dashboard (módulo 6), calculadas con funciones puras sobre los pedidos y
 * reservas. Hoy alimentan el modo demostración; el backend real las calculará en SQL con la
 * misma definición.
 *
 * Definición de «venta» (en la demostración): todo pedido que no está cancelado. El plan define
 * la venta real como pedido entregado y pagado; se ajusta en B-R4 cuando haya pagos.
 */

export type OrderLike = {
  status: OrderStatus;
  modality: "delivery" | "pickup";
  createdAt: string;
  totalCents: number;
  branchName: string;
  items: ReadonlyArray<{ name: string; quantity: number }>;
};

export type ReservationLike = {
  startsAt: string;
  partySize: number;
  status: string;
  branch: string;
  name: string;
};

export const isSale = (order: Pick<OrderLike, "status">) => order.status !== "cancelled";

export function byBranch<T extends { branchName?: string; branch?: string }>(
  rows: readonly T[],
  branch: string | null,
): T[] {
  if (!branch) return [...rows];
  return rows.filter((row) => (row.branchName ?? row.branch) === branch);
}

export type TodaySummary = { salesCents: number; orders: number; averageCents: number };

export function todaySummary(orders: readonly OrderLike[], now: number): TodaySummary {
  const today = dateKeyLima(now);
  const sales = orders.filter((o) => isSale(o) && dateKeyLima(o.createdAt) === today);
  const salesCents = sales.reduce((sum, o) => sum + o.totalCents, 0);
  return {
    salesCents,
    orders: sales.length,
    averageCents: sales.length === 0 ? 0 : Math.round(salesCents / sales.length),
  };
}

export type DishRank = { name: string; quantity: number };

/** Platos más pedidos hoy, por cantidad. */
export function topDishes(orders: readonly OrderLike[], now: number, limit = 5): DishRank[] {
  const today = dateKeyLima(now);
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (!isSale(order) || dateKeyLima(order.createdAt) !== today) continue;
    for (const item of order.items) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity);
    }
  }
  return [...totals.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es"))
    .slice(0, limit);
}

export type StatusCount = { status: OrderStatus; label: string; count: number };

/** Pedidos de hoy por estado, en el orden del flujo. «Pendiente» se cuenta como «Recibido». */
export function statusBreakdown(orders: readonly OrderLike[], now: number): StatusCount[] {
  const today = dateKeyLima(now);
  const counts = new Map<OrderStatus, number>();
  for (const order of orders) {
    if (dateKeyLima(order.createdAt) !== today) continue;
    const status = order.status === "pending" ? "received" : order.status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return ORDER_STATUSES.filter((s) => s !== "pending")
    .map((status) => ({ status, label: STATUS_LABELS[status], count: counts.get(status) ?? 0 }))
    .filter((row) => row.count > 0);
}

export function modalityBreakdown(orders: readonly OrderLike[], now: number) {
  const today = dateKeyLima(now);
  const sales = orders.filter((o) => isSale(o) && dateKeyLima(o.createdAt) === today);
  return {
    delivery: sales.filter((o) => o.modality === "delivery").length,
    pickup: sales.filter((o) => o.modality === "pickup").length,
  };
}

export type SalesPoint = { key: string; label: string; cents: number; isToday: boolean };

const weekdayFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "short" });

/**
 * Ventas de los últimos 7 días: seis días anteriores (datos de ejemplo) y el de hoy calculado
 * con los pedidos reales de la sesión.
 */
export function weekSeries(
  previousDaysCents: readonly number[],
  todayCents: number,
  now: number,
): SalesPoint[] {
  const DAY = 24 * 60 * 60 * 1000;
  const values = [...previousDaysCents.slice(-6), todayCents];
  return values.map((cents, index) => {
    const at = now - (values.length - 1 - index) * DAY;
    return {
      key: dateKeyLima(at),
      label: weekdayFmt.format(new Date(at)).replace(".", ""),
      cents,
      isToday: index === values.length - 1,
    };
  });
}

/** Variación porcentual frente a ayer, o null si ayer no hay con qué comparar. */
export function deltaPercent(
  todayCents: number,
  yesterdayCents: number | undefined,
): number | null {
  if (!yesterdayCents) return null;
  return Math.round(((todayCents - yesterdayCents) / yesterdayCents) * 100);
}

export type ReservationsToday = {
  count: number;
  people: number;
  upcoming: Array<{ time: string; name: string; partySize: number }>;
};

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function reservationsToday(
  reservations: readonly ReservationLike[],
  now: number,
): ReservationsToday {
  const today = dateKeyLima(now);
  const active = reservations
    .filter(
      (r) =>
        (r.status === "confirmed" || r.status === "arrived") && dateKeyLima(r.startsAt) === today,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return {
    count: active.length,
    people: active.reduce((sum, r) => sum + r.partySize, 0),
    upcoming: active
      .filter((r) => Date.parse(r.startsAt) >= now - 30 * 60_000)
      .slice(0, 4)
      .map((r) => ({
        time: timeFmt.format(new Date(r.startsAt)),
        name: r.name,
        partySize: r.partySize,
      })),
  };
}
