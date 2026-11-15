import { describe, expect, it } from "vitest";

import {
  addLine,
  cartCount,
  cartSubtotalCents,
  type CartLineInput,
  lineKey,
  MAX_QUANTITY,
  parseStoredLines,
  removeLine,
  setQuantity,
} from "./cart";

const parihuela: CartLineInput = {
  productId: 300,
  productSlug: "parihuelas",
  name: "Parihuelas",
  variantId: 302,
  variantLabel: "Cabrilla",
  choices: {},
  note: "",
  unitPriceCents: 5800,
  imageUrl: null,
};

const milanesa: CartLineInput = {
  productId: 541,
  productSlug: "milanesa-de-pollo",
  name: "Milanesa de pollo",
  variantId: 542,
  variantLabel: null,
  choices: { "Guarnición 01": "Arroz" },
  note: "sin culantro",
  unitPriceCents: 3500,
  imageUrl: null,
};

describe("lineKey", () => {
  it("es igual para el mismo plato con las mismas elecciones, sin importar el orden", () => {
    const a = lineKey({ ...milanesa, choices: { b: "2", a: "1" } });
    const b = lineKey({ ...milanesa, choices: { a: "1", b: "2" } });
    expect(a).toBe(b);
  });

  it("cambia con la variante, las elecciones o la nota", () => {
    const base = lineKey(milanesa);
    expect(lineKey({ ...milanesa, variantId: 999 })).not.toBe(base);
    expect(lineKey({ ...milanesa, choices: { "Guarnición 01": "Papas" } })).not.toBe(base);
    expect(lineKey({ ...milanesa, note: "con ají" })).not.toBe(base);
  });
});

describe("addLine", () => {
  it("agrega una línea nueva sin modificar la lista original", () => {
    const original: ReturnType<typeof addLine> = [];
    const lines = addLine(original, parihuela, 2);
    expect(original).toEqual([]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ name: "Parihuelas", quantity: 2 });
  });

  it("suma la cantidad si el plato es idéntico", () => {
    const lines = addLine(addLine([], parihuela, 1), parihuela, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(3);
  });

  it("separa el mismo plato con otra nota", () => {
    const lines = addLine(addLine([], milanesa, 1), { ...milanesa, note: "" }, 1);
    expect(lines).toHaveLength(2);
  });

  it("no pasa del máximo por línea", () => {
    const lines = addLine(addLine([], parihuela, 45), parihuela, 20);
    expect(lines[0]?.quantity).toBe(MAX_QUANTITY);
  });

  it("recorta la nota a 200 caracteres y quita espacios", () => {
    const lines = addLine([], { ...milanesa, note: `  ${"a".repeat(300)}  ` }, 1);
    expect(lines[0]?.note).toHaveLength(200);
  });
});

describe("setQuantity y removeLine", () => {
  it("cambia la cantidad y elimina con cero", () => {
    const lines = addLine(addLine([], parihuela, 1), milanesa, 1);
    const key = lines[0]?.key ?? "";
    expect(setQuantity(lines, key, 4)[0]?.quantity).toBe(4);
    expect(setQuantity(lines, key, 0)).toHaveLength(1);
    expect(removeLine(lines, key).map((l) => l.name)).toEqual(["Milanesa de pollo"]);
  });
});

describe("totales", () => {
  it("cuenta platos y suma el subtotal mostrado (el servidor recalcula en F2-01)", () => {
    const lines = addLine(addLine([], parihuela, 2), milanesa, 1);
    expect(cartCount(lines)).toBe(3);
    expect(cartSubtotalCents(lines)).toBe(5800 * 2 + 3500);
  });
});

describe("parseStoredLines", () => {
  it("acepta líneas válidas guardadas", () => {
    const lines = addLine([], parihuela, 1);
    expect(parseStoredLines(JSON.parse(JSON.stringify(lines)))).toEqual(lines);
  });

  it("descarta datos corruptos sin fallar", () => {
    expect(parseStoredLines("basura")).toEqual([]);
    expect(parseStoredLines([{ name: "x" }])).toEqual([]);
    expect(parseStoredLines(null)).toEqual([]);
  });
});
