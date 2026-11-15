import { describe, expect, it } from "vitest";

import type { Product } from "@/types/catalog";

import { quoteCart, type QuoteItem } from "./quote";

const base: Product = {
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

const parihuela: Product = {
  ...base,
  id: 300,
  name: "Parihuelas",
  priceCents: 4200,
  variants: [
    { id: 301, label: "Pesca del día", priceCents: 4200, isAvailable: true, selections: {} },
    { id: 302, label: "Cabrilla", priceCents: 5800, isAvailable: false, selections: {} },
  ],
};

const milanesa: Product = {
  ...base,
  id: 541,
  name: "Milanesa",
  priceCents: 3500,
  variants: [
    { id: 542, label: "Milanesa", priceCents: 3500, isAvailable: true, selections: { G: null } },
  ],
  choiceGroups: [{ key: "G", label: "Elige tu acompañamiento", options: ["Arroz", "Papas"] }],
};

const catalog = new Map([base, parihuela, milanesa].map((p) => [p.id, p]));
const item = (overrides: Partial<QuoteItem>): QuoteItem => ({
  productId: 1,
  variantId: null,
  quantity: 1,
  choices: {},
  note: "",
  ...overrides,
});

describe("quoteCart", () => {
  it("recalcula con los precios de la base, no con los del navegador", () => {
    const quote = quoteCart(
      [item({ quantity: 2 }), item({ productId: 300, variantId: 301 })],
      catalog,
      {
        feeCents: 750,
        minOrderCents: 0,
      },
    );
    expect(quote.issues).toEqual([]);
    expect(quote.lines.map((l) => [l.name, l.unitPriceCents, l.lineTotalCents])).toEqual([
      ["Ceviche", 4500, 9000],
      ["Parihuelas", 4200, 4200],
    ]);
    expect(quote).toMatchObject({ subtotalCents: 13200, deliveryCents: 750, totalCents: 13950 });
  });

  it("recojo: sin costo de envío", () => {
    const quote = quoteCart([item({})], catalog, null);
    expect(quote).toMatchObject({ deliveryCents: 0, totalCents: 4500 });
  });

  it("marca platos inexistentes, agotados o variantes que no son del plato", () => {
    const quote = quoteCart(
      [
        item({ productId: 999 }),
        item({ productId: 300, variantId: 302 }),
        item({ productId: 300, variantId: 542 }),
        item({ productId: 300, variantId: null }),
      ],
      catalog,
      null,
    );
    expect(quote.issues.map((i) => [i.index, i.code])).toEqual([
      [0, "not_found"],
      [1, "unavailable"],
      [2, "invalid_variant"],
      [3, "invalid_variant"],
    ]);
  });

  it("exige las elecciones obligatorias y rechaza opciones inventadas", () => {
    const quote = quoteCart(
      [
        item({ productId: 541, variantId: 542 }),
        item({ productId: 541, variantId: 542, choices: { G: "Yuca dorada" } }),
        item({ productId: 541, variantId: 542, choices: { G: "Papas" } }),
      ],
      catalog,
      null,
    );
    expect(quote.issues.map((i) => [i.index, i.code])).toEqual([
      [0, "missing_choice"],
      [1, "invalid_choice"],
    ]);
    // Solo la línea válida se cotiza; las otras quedan como problemas a resolver.
    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0]?.choices).toEqual({ G: "Papas" });
  });

  it("descarta elecciones de grupos que el plato no tiene", () => {
    const quote = quoteCart([item({ choices: { Hackeo: "x" } })], catalog, null);
    expect(quote.lines[0]?.choices).toEqual({});
  });

  it("avisa cuánto falta para el pedido mínimo", () => {
    const quote = quoteCart([item({})], catalog, { feeCents: 750, minOrderCents: 6000 });
    expect(quote.missingForMinimumCents).toBe(1500);
  });
});
