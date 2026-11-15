import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/types/catalog";

import { type CheckoutDeps, placeOrder } from "./place-order";

const LUNCH = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "11:00", close: "17:00" }));
const NOON = new Date("2026-11-16T12:00:00-05:00");
const NIGHT = new Date("2026-11-16T22:00:00-05:00");

const ceviche: Product = {
  id: 1,
  slug: "ceviche",
  name: "Ceviche",
  description: "",
  priceCents: 4500,
  variantLabel: null,
  categoryId: 1,
  menus: ["marina"],
  image: null,
  tags: [],
  allergens: [],
  portion: null,
  isAvailable: true,
  variants: [],
  choiceGroups: [],
};

function deps(overrides: Partial<CheckoutDeps> = {}): CheckoutDeps {
  return {
    verifyTurnstile: vi.fn(async () => true),
    hitRateLimit: vi.fn(async () => true),
    getBranchesAndZones: vi.fn(async () => ({
      branches: [
        { id: 1, slug: "lince", name: "Lince", whatsapp: null, openingHours: LUNCH },
        { id: 2, slug: "jesus-maria", name: "Jesús María", whatsapp: null, openingHours: LUNCH },
      ],
      zones: [{ district: "Breña", branchId: 2, feeCents: 750, minOrderCents: 0, etaMinutes: 45 }],
    })),
    getProductsByIds: vi.fn(async () => new Map([[1, ceviche]])),
    createOrder: vi.fn(async () => ({ orderId: 10, trackingToken: "tok-123" })),
    ...overrides,
  };
}

const body = (extra: Record<string, unknown> = {}) => ({
  name: "Rosa",
  phone: "987654321",
  email: "",
  modality: "pickup",
  branchSlug: "jesus-maria",
  district: "",
  address: "",
  addressReference: "",
  scheduledFor: "",
  paymentMethod: "cash",
  cashChangeForCents: null,
  notes: "",
  acceptTerms: true,
  turnstileToken: "token",
  // El navegador manda un precio falso: debe ignorarse.
  items: [{ productId: 1, variantId: null, quantity: 2, choices: {}, note: "", unitPriceCents: 1 }],
  ...extra,
});

const ctx = { ip: "1.2.3.4", now: NOON };

describe("placeOrder", () => {
  it("crea un recojo con el total calculado en el servidor", async () => {
    const d = deps();
    const result = await placeOrder(body(), ctx, d);
    expect(result.status).toBe(201);
    expect(result.body).toEqual({
      success: true,
      data: { orderId: 10, trackingToken: "tok-123", totalCents: 9000 },
    });
    const call = vi.mocked(d.createOrder).mock.calls[0]?.[0];
    expect(call?.order).toMatchObject({
      branch_id: 2,
      modality: "pickup",
      subtotal_cents: 9000,
      delivery_cents: 0,
      total_cents: 9000,
      address: null,
    });
    expect(call?.items[0]).toMatchObject({ unit_price_cents: 4500, line_total_cents: 9000 });
  });

  it("delivery: usa la tarifa y la sede de la zona", async () => {
    const d = deps();
    const result = await placeOrder(
      body({
        modality: "delivery",
        district: "Breña",
        address: "Jr. Huaraz 123",
        branchSlug: "lince",
      }),
      ctx,
      d,
    );
    expect(result.status).toBe(201);
    expect(vi.mocked(d.createOrder).mock.calls[0]?.[0].order).toMatchObject({
      branch_id: 2,
      delivery_cents: 750,
      total_cents: 9750,
      district: "Breña",
    });
  });

  it("400 con errores por campo si los datos no son válidos", async () => {
    const result = await placeOrder(body({ phone: "123" }), ctx, deps());
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      success: false,
      error: { fields: { phone: expect.any(String) } },
    });
  });

  it("429 si se supera el límite de peticiones", async () => {
    const result = await placeOrder(body(), ctx, deps({ hitRateLimit: vi.fn(async () => false) }));
    expect(result.status).toBe(429);
  });

  it("403 si Turnstile no valida y no crea nada", async () => {
    const d = deps({ verifyTurnstile: vi.fn(async () => false) });
    const result = await placeOrder(body(), ctx, d);
    expect(result.status).toBe(403);
    expect(d.createOrder).not.toHaveBeenCalled();
  });

  it("no llega a distritos fuera de las zonas", async () => {
    const result = await placeOrder(
      body({ modality: "delivery", district: "Chorrillos", address: "Av. 1 123" }),
      ctx,
      deps(),
    );
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      error: { fields: { district: expect.stringMatching(/no llegamos/i) } },
    });
  });

  it("409 fuera de horario si no es programado", async () => {
    const result = await placeOrder(body(), { ...ctx, now: NIGHT }, deps());
    expect(result.status).toBe(409);
    expect(result.body).toMatchObject({ error: { code: "closed" } });
  });

  it("acepta un pedido programado dentro del horario aunque ahora esté cerrado", async () => {
    const result = await placeOrder(
      body({ scheduledFor: "2026-11-17T13:30:00-05:00" }),
      { ...ctx, now: NIGHT },
      deps(),
    );
    expect(result.status).toBe(201);
  });

  it("rechaza un pedido programado fuera de horario o en el pasado", async () => {
    const late = await placeOrder(body({ scheduledFor: "2026-11-17T20:00:00-05:00" }), ctx, deps());
    expect(late.body).toMatchObject({ error: { fields: { scheduledFor: expect.any(String) } } });
    const past = await placeOrder(body({ scheduledFor: "2026-11-16T11:30:00-05:00" }), ctx, deps());
    expect(past.status).toBe(400);
  });

  it("409 si un plato se agotó o ya no existe", async () => {
    const result = await placeOrder(
      body(),
      ctx,
      deps({ getProductsByIds: vi.fn(async () => new Map()) }),
    );
    expect(result.status).toBe(409);
    expect(result.body).toMatchObject({ error: { code: "cart_changed" } });
  });

  it("los pagos en línea llegan en la Fase 3", async () => {
    const result = await placeOrder(body({ paymentMethod: "yape" }), ctx, deps());
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: { fields: { paymentMethod: expect.any(String) } } });
  });

  it("el vuelto debe cubrir el total", async () => {
    const result = await placeOrder(body({ cashChangeForCents: 5000 }), ctx, deps());
    expect(result.body).toMatchObject({
      error: { fields: { cashChangeForCents: expect.any(String) } },
    });
  });

  it("500 sin detalles técnicos si la base falla", async () => {
    const result = await placeOrder(
      body(),
      ctx,
      deps({ createOrder: vi.fn(async () => Promise.reject(new Error("pg: deadlock"))) }),
    );
    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain("deadlock");
  });
});
