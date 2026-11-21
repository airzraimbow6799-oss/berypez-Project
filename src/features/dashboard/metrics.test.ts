import { describe, expect, it } from "vitest";

import {
  byBranch,
  deltaPercent,
  isSale,
  modalityBreakdown,
  type OrderLike,
  reservationsToday,
  statusBreakdown,
  todaySummary,
  topDishes,
  weekSeries,
} from "./metrics";

// 21-nov-2026 14:00 en Lima.
const NOW = Date.parse("2026-11-21T19:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const order = (over: Partial<OrderLike> = {}): OrderLike => ({
  status: "delivered",
  modality: "pickup",
  createdAt: minutesAgo(30),
  totalCents: 4000,
  branchName: "Lince",
  items: [{ name: "Ceviche clásico", quantity: 1 }],
  ...over,
});

describe("ventas de hoy", () => {
  it("suma los pedidos de hoy que no están cancelados y calcula el ticket promedio", () => {
    const orders = [
      order({ totalCents: 4000 }),
      order({ totalCents: 6000, status: "in_kitchen" }),
      order({ totalCents: 9999, status: "cancelled" }),
      order({ totalCents: 5000, createdAt: minutesAgo(60 * 30) }), // ayer
    ];
    expect(todaySummary(orders, NOW)).toEqual({ salesCents: 10000, orders: 2, averageCents: 5000 });
  });

  it("sin pedidos no divide entre cero", () => {
    expect(todaySummary([], NOW)).toEqual({ salesCents: 0, orders: 0, averageCents: 0 });
  });

  it("un pedido a las 23:50 de Lima cuenta en ese día, no en el siguiente", () => {
    const lateNow = Date.parse("2026-11-22T04:55:00Z"); // 23:55 del 21 en Lima
    const lateOrder = order({ createdAt: "2026-11-22T04:50:00Z" });
    expect(todaySummary([lateOrder], lateNow).orders).toBe(1);
  });

  it("isSale deja fuera solo lo cancelado", () => {
    expect(isSale({ status: "cancelled" })).toBe(false);
    expect(isSale({ status: "pending" })).toBe(true);
  });
});

describe("filtro por sede", () => {
  it("sin sede devuelve todo y con sede filtra", () => {
    const orders = [order(), order({ branchName: "Jesús María" })];
    expect(byBranch(orders, null)).toHaveLength(2);
    expect(byBranch(orders, "Lince")).toHaveLength(1);
  });
});

describe("platos más pedidos", () => {
  it("ordena por cantidad y desempata por nombre", () => {
    const orders = [
      order({
        items: [
          { name: "Jalea mixta", quantity: 2 },
          { name: "Ceviche clásico", quantity: 1 },
        ],
      }),
      order({ items: [{ name: "Ceviche clásico", quantity: 1 }] }),
      order({ status: "cancelled", items: [{ name: "Chaufa", quantity: 9 }] }),
    ];
    expect(topDishes(orders, NOW)).toEqual([
      { name: "Ceviche clásico", quantity: 2 },
      { name: "Jalea mixta", quantity: 2 },
    ]);
  });

  it("respeta el límite", () => {
    const orders = [order({ items: ["a", "b", "c"].map((name) => ({ name, quantity: 1 })) })];
    expect(topDishes(orders, NOW, 2)).toHaveLength(2);
  });
});

describe("estados y modalidad", () => {
  it("cuenta por estado en orden de flujo y junta «pendiente» con «recibido»", () => {
    const orders = [
      order({ status: "pending" }),
      order({ status: "received" }),
      order({ status: "delivered" }),
      order({ status: "in_kitchen" }),
    ];
    const rows = statusBreakdown(orders, NOW);
    expect(rows.map((r) => [r.status, r.count])).toEqual([
      ["received", 2],
      ["in_kitchen", 1],
      ["delivered", 1],
    ]);
  });

  it("separa delivery y recojo sin contar cancelados", () => {
    const orders = [
      order({ modality: "delivery" }),
      order({ modality: "pickup" }),
      order({ modality: "pickup", status: "cancelled" }),
    ];
    expect(modalityBreakdown(orders, NOW)).toEqual({ delivery: 1, pickup: 1 });
  });
});

describe("serie de 7 días", () => {
  it("seis días anteriores más hoy, con hoy marcado y fechas distintas", () => {
    const series = weekSeries([100, 200, 300, 400, 500, 600], 700, NOW);
    expect(series).toHaveLength(7);
    expect(series.map((p) => p.cents)).toEqual([100, 200, 300, 400, 500, 600, 700]);
    expect(series.filter((p) => p.isToday)).toHaveLength(1);
    expect(series.at(-1)?.key).toBe("2026-11-21");
    expect(new Set(series.map((p) => p.key)).size).toBe(7);
  });

  it("si faltan días anteriores usa los que hay", () => {
    expect(weekSeries([100], 50, NOW)).toHaveLength(2);
  });
});

describe("deltaPercent", () => {
  it("compara con ayer y evita dividir entre cero", () => {
    expect(deltaPercent(1100, 1000)).toBe(10);
    expect(deltaPercent(500, 1000)).toBe(-50);
    expect(deltaPercent(500, 0)).toBeNull();
    expect(deltaPercent(500, undefined)).toBeNull();
  });
});

describe("reservas de hoy", () => {
  const r = (over: Record<string, unknown>) => ({
    startsAt: "2026-11-21T22:00:00Z",
    partySize: 4,
    status: "confirmed",
    branch: "Lince",
    name: "Valeria",
    ...over,
  });

  it("cuenta reservas y personas de hoy y lista las próximas en orden", () => {
    const list = [
      r({ startsAt: "2026-11-22T00:30:00Z", name: "Tarde", partySize: 2 }),
      r({ startsAt: "2026-11-21T20:00:00Z", name: "Temprano", partySize: 6 }),
      r({ status: "cancelled", partySize: 9 }),
      r({ startsAt: "2026-11-23T20:00:00Z" }),
    ];
    const today = reservationsToday(list, NOW);
    expect(today.count).toBe(2);
    expect(today.people).toBe(8);
    expect(today.upcoming.map((u) => u.name)).toEqual(["Temprano", "Tarde"]);
  });
});
