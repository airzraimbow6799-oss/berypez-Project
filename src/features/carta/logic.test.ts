import { describe, expect, it } from "vitest";

import {
  canMarkAvailable,
  filterDishes,
  isSoldOut,
  parsePriceInput,
  parseStockInput,
  priceChangeNeedsConfirm,
  summarize,
  withStock,
} from "./logic";
import { type Dish, newDishFormSchema } from "./schema";

const dish = (over: Partial<Dish> = {}): Dish => ({
  id: 1,
  name: "Ceviche clásico",
  description: "Pescado del día",
  category: "Ceviches",
  priceCents: 3800,
  stockQty: null,
  isAvailable: true,
  ...over,
});

describe("isSoldOut", () => {
  it("disponible y sin control de stock no está agotado", () => {
    expect(isSoldOut(dish())).toBe(false);
  });
  it("agotado a mano", () => {
    expect(isSoldOut(dish({ isAvailable: false }))).toBe(true);
  });
  it("stock 0 cuenta como agotado aunque el interruptor diga disponible", () => {
    expect(isSoldOut(dish({ stockQty: 0 }))).toBe(true);
  });
});

describe("priceChangeNeedsConfirm", () => {
  it("un ajuste pequeño no pide confirmación", () => {
    expect(priceChangeNeedsConfirm(3800, 4000)).toBe(false);
  });
  it("más de 40 % pide confirmación, subiendo o bajando", () => {
    expect(priceChangeNeedsConfirm(3800, 8000)).toBe(true);
    expect(priceChangeNeedsConfirm(3800, 1000)).toBe(true);
  });
  it("exactamente 40 % todavía no pide confirmación", () => {
    expect(priceChangeNeedsConfirm(1000, 1400)).toBe(false);
  });
});

describe("parsePriceInput", () => {
  it("acepta punto y coma decimal", () => {
    expect(parsePriceInput("48.5")).toEqual({ ok: true, cents: 4850 });
    expect(parsePriceInput("48,50")).toEqual({ ok: true, cents: 4850 });
    expect(parsePriceInput(" 38 ")).toEqual({ ok: true, cents: 3800 });
  });
  it("rechaza vacío, texto, cero, negativos y precios exagerados", () => {
    for (const text of ["", "abc", "0", "-5", "5000"]) {
      expect(parsePriceInput(text).ok, text).toBe(false);
    }
  });
});

describe("parseStockInput", () => {
  it("vacío significa sin control de cantidad", () => {
    expect(parseStockInput("")).toEqual({ ok: true, qty: null });
  });
  it("acepta enteros desde 0", () => {
    expect(parseStockInput("0")).toEqual({ ok: true, qty: 0 });
    expect(parseStockInput("12")).toEqual({ ok: true, qty: 12 });
  });
  it("rechaza decimales, negativos y textos", () => {
    for (const text of ["2.5", "-1", "mucho", "5000"]) {
      expect(parseStockInput(text).ok, text).toBe(false);
    }
  });
});

describe("withStock", () => {
  it("al llegar a 0 el plato queda agotado", () => {
    expect(withStock(dish({ stockQty: 3 }), 0)).toMatchObject({ stockQty: 0, isAvailable: false });
  });
  it("al reponer desde 0 vuelve a estar disponible", () => {
    const empty = dish({ stockQty: 0, isAvailable: false });
    expect(withStock(empty, 5)).toMatchObject({ stockQty: 5, isAvailable: true });
  });
  it("cambiar el stock de un plato agotado a mano no lo reactiva", () => {
    const manual = dish({ stockQty: 4, isAvailable: false });
    expect(withStock(manual, 6)).toMatchObject({ stockQty: 6, isAvailable: false });
  });
  it("quitar el control de stock deja el resto igual", () => {
    expect(withStock(dish({ stockQty: 3 }), null)).toMatchObject({
      stockQty: null,
      isAvailable: true,
    });
  });
});

describe("canMarkAvailable", () => {
  it("con stock 0 no se puede marcar disponible", () => {
    expect(canMarkAvailable({ stockQty: 0 })).toBe(false);
    expect(canMarkAvailable({ stockQty: 2 })).toBe(true);
    expect(canMarkAvailable({ stockQty: null })).toBe(true);
  });
});

describe("filterDishes", () => {
  const all = [
    dish({ id: 1, name: "Ceviche clásico" }),
    dish({ id: 2, name: "Jalea mixta", category: "Piqueos", isAvailable: false }),
    dish({ id: 3, name: "Chaufa de mariscos", category: "Fondos", stockQty: 0 }),
  ];
  it("busca sin importar tildes ni mayúsculas", () => {
    expect(
      filterDishes(all, { query: "CLASICO", category: null, onlySoldOut: false }),
    ).toHaveLength(1);
  });
  it("filtra por categoría", () => {
    expect(filterDishes(all, { query: "", category: "Piqueos", onlySoldOut: false })).toHaveLength(
      1,
    );
  });
  it("solo agotados incluye los de stock cero", () => {
    const ids = filterDishes(all, { query: "", category: null, onlySoldOut: true }).map(
      (d) => d.id,
    );
    expect(ids).toEqual([2, 3]);
  });
});

describe("summarize", () => {
  it("cuenta platos, agotados y poco stock", () => {
    const list = [
      dish({ id: 1 }),
      dish({ id: 2, isAvailable: false }),
      dish({ id: 3, stockQty: 0 }),
      dish({ id: 4, stockQty: 3 }),
      dish({ id: 5, stockQty: 40 }),
    ];
    expect(summarize(list)).toEqual({ total: 5, soldOut: 2, lowStock: 1 });
  });
});

describe("newDishFormSchema", () => {
  const valid = {
    name: "Tiradito nikkei",
    description: "",
    category: "Entradas",
    price: "34.5",
    stock: "",
  };
  it("convierte precio a céntimos y stock vacío a null", () => {
    const result = newDishFormSchema.parse(valid);
    expect(result.price).toBe(3450);
    expect(result.stock).toBeNull();
  });
  it("acepta stock numérico", () => {
    expect(newDishFormSchema.parse({ ...valid, stock: "10" }).stock).toBe(10);
  });
  it("rechaza nombres cortos y duplicados «(Copiar)»", () => {
    expect(newDishFormSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(newDishFormSchema.safeParse({ ...valid, name: "Ceviche (Copiar)" }).success).toBe(false);
  });
  it("rechaza categoría desconocida, precio inválido y stock negativo", () => {
    expect(newDishFormSchema.safeParse({ ...valid, category: "Postres" }).success).toBe(false);
    expect(newDishFormSchema.safeParse({ ...valid, price: "0" }).success).toBe(false);
    expect(newDishFormSchema.safeParse({ ...valid, price: "abc" }).success).toBe(false);
    expect(newDishFormSchema.safeParse({ ...valid, stock: "-2" }).success).toBe(false);
  });
});
