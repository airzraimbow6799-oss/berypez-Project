import { describe, expect, it } from "vitest";

import {
  filterDishes,
  hasPriceOptions,
  isSoldOut,
  parsePriceInput,
  priceChangeNeedsConfirm,
  summarize,
} from "./logic";
import { type Dish, type DishFormInput, dishFormSchema, dishToForm, emptyDishForm } from "./schema";

const dish = (over: Partial<Dish> = {}): Dish => ({
  id: 1,
  name: "Ceviche Berypez",
  description: "Plato de la casa",
  menus: ["marina"],
  section: "Ceviches",
  priceCents: 4800,
  image: { url: "/catalog/ceviche-berypez.webp", alt: "Ceviche Berypez" },
  tags: [],
  isAvailable: true,
  priceGroup: null,
  choiceGroups: [],
  ...over,
});

const chicharrones = dish({
  id: 2,
  name: "Chicharrones",
  section: "Chicharrones",
  priceCents: 4000,
  priceGroup: {
    label: "Elige tu chicharrón",
    options: [
      { label: "Pesca del día", priceCents: 4000 },
      { label: "Calamar", priceCents: 4800 },
    ],
  },
});

describe("isSoldOut", () => {
  it("sin stock: solo está agotado cuando se marca así", () => {
    expect(isSoldOut(dish())).toBe(false);
    expect(isSoldOut(dish({ isAvailable: false }))).toBe(true);
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

describe("filterDishes", () => {
  const list = [
    dish({ description: "Ceviche mixto con champiñones" }),
    chicharrones,
    dish({
      id: 3,
      name: "Lomo saltado",
      menus: ["criolla"],
      section: "Fondos",
      isAvailable: false,
    }),
    dish({ id: 4, name: "Leche de tigre", tags: ["picante"], menus: ["piqueos"] }),
  ];
  const names = (filters: Parameters<typeof filterDishes>[1]) =>
    filterDishes(list, filters).map((d) => d.name);

  it("busca sin tildes en nombre, sección, etiquetas y opciones de los apartados", () => {
    const base = { menu: null, onlySoldOut: false };
    expect(names({ ...base, query: "CHAMPINONES" })).toEqual(["Ceviche Berypez"]);
    expect(names({ ...base, query: "calamar" })).toEqual(["Chicharrones"]);
    expect(names({ ...base, query: "picante" })).toEqual(["Leche de tigre"]);
    expect(names({ ...base, query: "fondos" })).toEqual(["Lomo saltado"]);
  });
  it("filtra por carta y por «solo agotados»", () => {
    expect(names({ query: "", menu: "criolla", onlySoldOut: false })).toEqual(["Lomo saltado"]);
    expect(names({ query: "", menu: null, onlySoldOut: true })).toEqual(["Lomo saltado"]);
  });
});

describe("summarize y hasPriceOptions", () => {
  it("cuenta platos, agotados y platos con apartados", () => {
    const list = [
      dish(),
      chicharrones,
      dish({ id: 3, isAvailable: false, choiceGroups: [{ label: "Tipo", options: ["A", "B"] }] }),
    ];
    expect(summarize(list)).toEqual({ total: 3, soldOut: 1, withOptions: 2 });
    expect(hasPriceOptions(chicharrones)).toBe(true);
    expect(hasPriceOptions(dish())).toBe(false);
  });
});

describe("dishFormSchema", () => {
  const valid: DishFormInput = {
    ...emptyDishForm("marina"),
    name: "Tiradito nikkei",
    section: "Tiraditos",
    price: "34,5",
    tags: ["nuevo"],
  };

  it("convierte el precio a céntimos y describe la foto con el nombre", () => {
    const out = dishFormSchema.parse({ ...valid, image: { url: "blob:x", alt: "" } });
    expect(out).toMatchObject({
      priceCents: 3450,
      image: { url: "blob:x", alt: "Tiradito nikkei" },
    });
  });

  it("rechaza nombre corto, «(Copiar)», sin carta, sin sección o sin precio", () => {
    const bad: Array<Partial<DishFormInput>> = [
      { name: "A" },
      { name: "Ceviche (Copiar)" },
      { menus: [] },
      { section: "" },
      { price: "" },
      { price: "0" },
      { price: "abc" },
    ];
    for (const over of bad) {
      expect(dishFormSchema.safeParse({ ...valid, ...over }).success, JSON.stringify(over)).toBe(
        false,
      );
    }
  });

  it("con apartado con precio no pide precio normal y usa la opción más barata", () => {
    const out = dishFormSchema.parse({
      ...valid,
      price: "",
      priceGroup: {
        label: "Elige tu pescado",
        options: [
          { label: "Cabrilla", price: "48" },
          { label: "Pesca del día", price: "40" },
        ],
      },
    });
    expect(out.priceCents).toBe(4000);
    expect(out.priceGroup?.options[1]).toEqual({ label: "Pesca del día", priceCents: 4000 });
  });

  it("los apartados piden título y 2 opciones distintas", () => {
    const issues = (over: Partial<DishFormInput>) =>
      dishFormSchema.safeParse({ ...valid, ...over }).error?.issues.map((i) => i.path.join("."));
    expect(
      issues({ choiceGroups: [{ label: "Elige el tipo", options: ["Filete", "filete "] }] }),
    ).toContain("choiceGroups.0.options");
    expect(issues({ choiceGroups: [{ label: "", options: ["A"] }] })).toEqual(
      expect.arrayContaining(["choiceGroups.0.label", "choiceGroups.0.options"]),
    );
    expect(
      issues({ priceGroup: { label: "Tamaño", options: [{ label: "Grande", price: "" }] } }),
    ).toEqual(expect.arrayContaining(["priceGroup.options", "priceGroup.options.0.price"]));
  });

  it("un plato guardado vuelve al formulario y se guarda igual", () => {
    const sudados = dish({
      ...chicharrones,
      choiceGroups: [{ label: "Elige el tipo", options: ["Filete 200 GR", "Entero 550 GR"] }],
    });
    const { id: _id, ...expected } = sudados;
    expect(dishFormSchema.parse(dishToForm(sudados))).toEqual(expected);
  });
});
