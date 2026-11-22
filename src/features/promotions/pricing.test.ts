import { describe, expect, it } from "vitest";

import {
  byRelevance,
  cardPrices,
  isPromotionLive,
  paidQuantity,
  promoBadge,
  promoUnitPrice,
} from "./pricing";

const rule = (over = {}) => ({
  kind: "percent" as const,
  percentOff: 20 as number | null,
  priceCents: null as number | null,
  variantId: null as number | null,
  ...over,
});
const soles = (c: number) => `S/ ${(c / 100).toFixed(2)}`;

describe("precios con promoción", () => {
  it("porcentaje, precio fijo y 2×1", () => {
    expect(promoUnitPrice(4800, rule(), null)).toBe(3840);
    expect(
      promoUnitPrice(4800, rule({ kind: "fixed_price", percentOff: null, priceCents: 3500 }), null),
    ).toBe(3500);
    // Un precio fijo mayor al normal no sube el precio.
    expect(
      promoUnitPrice(3000, rule({ kind: "fixed_price", percentOff: null, priceCents: 3500 }), null),
    ).toBe(3000);
    expect(promoUnitPrice(4800, rule({ kind: "two_for_one", percentOff: null }), null)).toBe(4800);
    expect(promoUnitPrice(4800, null, null)).toBe(4800);
  });

  it("una promoción de una opción no aplica a las demás", () => {
    const fixed = rule({ kind: "fixed_price", percentOff: null, priceCents: 3500, variantId: 7 });
    expect(promoUnitPrice(4800, fixed, 7)).toBe(3500);
    expect(promoUnitPrice(4800, fixed, 8)).toBe(4800);
  });

  it("2×1 cobra la mitad redondeada hacia arriba", () => {
    const twoForOne = rule({ kind: "two_for_one", percentOff: null });
    expect([1, 2, 3, 4, 5].map((q) => paidQuantity(twoForOne, null, q))).toEqual([1, 1, 2, 2, 3]);
    expect(paidQuantity(rule(), null, 4)).toBe(4);
  });

  it("etiquetas cortas", () => {
    expect(promoBadge(rule(), soles)).toBe("−20 %");
    expect(
      promoBadge(rule({ kind: "fixed_price", percentOff: null, priceCents: 3500 }), soles),
    ).toBe("A S/ 35.00");
    expect(promoBadge(rule({ kind: "two_for_one", percentOff: null }), soles)).toBe("2×1");
  });
});

describe("vigencia y relevancia", () => {
  const now = Date.parse("2026-11-22T12:00:00Z");
  const p = (over = {}) => ({
    isActive: true,
    isFeatured: false,
    startsAt: null,
    endsAt: null,
    ...over,
  });

  it("vigente solo si está activa y dentro de fechas", () => {
    expect(isPromotionLive(p(), now)).toBe(true);
    expect(isPromotionLive(p({ isActive: false }), now)).toBe(false);
    expect(isPromotionLive(p({ startsAt: "2026-11-23T00:00:00Z" }), now)).toBe(false);
    expect(isPromotionLive(p({ endsAt: "2026-11-22T12:00:00Z" }), now)).toBe(false);
    expect(isPromotionLive(p({ endsAt: "2026-11-22T13:00:00Z" }), now)).toBe(true);
  });

  it("primero la destacada, luego la que termina antes, luego la más nueva", () => {
    const list = [
      { ...p({ endsAt: null }), createdAt: "2026-11-20T00:00:00Z", name: "vieja" },
      { ...p({ endsAt: null }), createdAt: "2026-11-21T00:00:00Z", name: "nueva" },
      { ...p({ endsAt: "2026-11-30T00:00:00Z" }), name: "termina" },
      { ...p({ isFeatured: true }), name: "destacada" },
    ];
    expect([...list].sort(byRelevance).map((x) => x.name)).toEqual([
      "destacada",
      "termina",
      "nueva",
      "vieja",
    ]);
  });
});

describe("cardPrices", () => {
  const promo = (over = {}) => ({
    id: 1,
    kind: "percent" as const,
    percentOff: 20,
    priceCents: null,
    variantId: null,
    title: "P",
    imageUrl: null,
    isFeatured: false,
    startsAt: null,
    endsAt: null,
    ...over,
  });
  const variants = [
    { id: 7, priceCents: 4000 },
    { id: 8, priceCents: 4800 },
  ];

  it("porcentaje: «desde» con el descuento sobre la opción más barata", () => {
    expect(cardPrices({ priceCents: 4000, variants, promotion: promo() })).toEqual({
      regularCents: 4000,
      promoCents: 3200,
      isFrom: true,
    });
  });
  it("precio fijo de una opción: muestra esa opción", () => {
    const fixed = promo({ kind: "fixed_price", percentOff: null, priceCents: 3900, variantId: 8 });
    expect(cardPrices({ priceCents: 4000, variants, promotion: fixed })).toEqual({
      regularCents: 4800,
      promoCents: 3900,
      isFrom: false,
    });
  });
  it("2×1 no cambia el precio", () => {
    const twoForOne = promo({ kind: "two_for_one", percentOff: null });
    const prices = cardPrices({ priceCents: 4500, variants: [], promotion: twoForOne });
    expect(prices.promoCents).toBe(prices.regularCents);
  });
});
