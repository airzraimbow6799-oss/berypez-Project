import { describe, expect, it } from "vitest";

import type { Product } from "@/types/catalog";

import {
  canAddToCart,
  defaultSelection,
  missingChoices,
  toCartInput,
  unitPriceCents,
  visibleChoiceGroups,
} from "./selection";

const base: Product = {
  id: 1,
  slug: "x",
  name: "X",
  description: "",
  priceCents: 900,
  variantLabel: null,
  categoryId: 1,
  menus: ["el-bar"],
  image: { url: "https://x/img.webp", alt: "X" },
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
  variantLabel: "Elige tu pescado",
  variants: [
    {
      id: 301,
      label: "Pesca del día",
      priceCents: 4200,
      isAvailable: false,
      selections: { "Hecho de": "Pesca del día" },
    },
    {
      id: 302,
      label: "Cabrilla",
      priceCents: 5800,
      isAvailable: true,
      selections: { "Hecho de": "Cabrilla" },
    },
  ],
};

const cervezas: Product = {
  ...base,
  id: 1551,
  name: "Cervezas Nacionales",
  variantLabel: "Elige el tamaño",
  variants: [
    {
      id: 1553,
      label: "Chica",
      priceCents: 900,
      isAvailable: true,
      selections: { Cerveza: null, Tamaño: "Chica" },
    },
    {
      id: 1552,
      label: "Pilsen · Grande",
      priceCents: 1300,
      isAvailable: true,
      selections: { Cerveza: "Pilsen", Tamaño: "Grande" },
    },
  ],
  choiceGroups: [{ key: "Cerveza", label: "Elige la cerveza", options: ["Pilsen", "Cusqueña"] }],
};

describe("defaultSelection", () => {
  it("preselecciona la primera variante disponible", () => {
    expect(defaultSelection(parihuela).variantId).toBe(302);
  });

  it("sin variantes no elige ninguna", () => {
    expect(defaultSelection(base)).toEqual({ variantId: null, choices: {} });
  });
});

describe("precio y elecciones", () => {
  it("el precio sigue a la variante elegida", () => {
    expect(unitPriceCents(parihuela, 302)).toBe(5800);
    expect(unitPriceCents(base, null)).toBe(900);
  });

  it("pide la cerveza solo si la variante no la fija", () => {
    expect(visibleChoiceGroups(cervezas, 1553).map((g) => g.key)).toEqual(["Cerveza"]);
    expect(visibleChoiceGroups(cervezas, 1552)).toEqual([]);
    expect(missingChoices(cervezas, 1553, {})).toEqual(["Elige la cerveza"]);
    expect(missingChoices(cervezas, 1553, { Cerveza: "Cusqueña" })).toEqual([]);
  });

  it("no deja agregar sin elegir variante, con faltantes o si está agotado", () => {
    expect(canAddToCart(parihuela, { variantId: null, choices: {} })).toBe(false);
    expect(canAddToCart(parihuela, { variantId: 301, choices: {} })).toBe(false);
    expect(canAddToCart(parihuela, { variantId: 302, choices: {} })).toBe(true);
    expect(canAddToCart(cervezas, { variantId: 1553, choices: {} })).toBe(false);
    expect(canAddToCart({ ...base, isAvailable: false }, { variantId: null, choices: {} })).toBe(
      false,
    );
  });
});

describe("toCartInput", () => {
  it("arma la línea con variante, solo las elecciones visibles y la nota", () => {
    const input = toCartInput(
      cervezas,
      { variantId: 1553, choices: { Cerveza: "Cusqueña", Otra: "x" } },
      " bien helada ",
    );
    expect(input).toEqual({
      productId: 1551,
      productSlug: "x",
      name: "Cervezas Nacionales",
      variantId: 1553,
      variantLabel: "Chica",
      choices: { Cerveza: "Cusqueña" },
      note: " bien helada ",
      unitPriceCents: 900,
      imageUrl: "https://x/img.webp",
    });
  });
});
