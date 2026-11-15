import { describe, expect, it } from "vitest";

import type { Product } from "@/types/catalog";

import { applyFilters, matchesQuery, normalize, NO_FILTERS, scoreProduct } from "./search";

function product(overrides: Partial<Product>): Product {
  return {
    id: 1,
    slug: "x",
    name: "X",
    description: "",
    priceCents: 3000,
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
    ...overrides,
  };
}

const ceviche = product({
  id: 1,
  name: "Ceviche Berypez",
  description: "Pescado en leche de tigre",
});
const lomo = product({ id: 2, name: "Lomo saltado", priceCents: 4800, tags: [] });
const champi = product({
  id: 3,
  name: "Ceviche de champiñones",
  tags: ["vegetariano"],
  priceCents: 3500,
});
const rocoto = product({
  id: 4,
  name: "Ceviche al rojo vivo",
  tags: ["picante"],
  priceCents: 4500,
});
const fuente = product({ id: 5, name: "Fuente de ceviche", tags: ["compartir"], priceCents: 7500 });
const nino = product({ id: 6, name: "Espagueti – niño", tags: ["ninos"], priceCents: 2500 });
const all = [ceviche, lomo, champi, rocoto, fuente, nino];

describe("normalize", () => {
  it("quita tildes, mayúsculas y signos", () => {
    expect(normalize("  Champiñones, ¡ÁJÍ!  ")).toBe("champinones aji");
  });
});

describe("matchesQuery", () => {
  it("encuentra ceviches al escribir “seviche” o “cebiche” (sinónimos)", () => {
    expect(matchesQuery(ceviche, "seviche")).toBe(true);
    expect(matchesQuery(ceviche, "cebiche")).toBe(true);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(matchesQuery(champi, "CHAMPINONES")).toBe(true);
  });

  it("tolera una letra equivocada en palabras de 5 o más letras", () => {
    expect(matchesQuery(lomo, "saltdo")).toBe(true);
    expect(matchesQuery(lomo, "lomp")).toBe(false);
  });

  it("busca también en la descripción y exige todas las palabras", () => {
    expect(matchesQuery(ceviche, "leche tigre")).toBe(true);
    expect(matchesQuery(ceviche, "leche pollo")).toBe(false);
  });

  it("una búsqueda vacía coincide con todo", () => {
    expect(matchesQuery(lomo, "   ")).toBe(true);
  });
});

describe("scoreProduct", () => {
  it("prioriza coincidencias en el nombre sobre la descripción", () => {
    expect(scoreProduct(ceviche, "ceviche")).toBeGreaterThan(scoreProduct(ceviche, "tigre"));
  });
});

describe("applyFilters", () => {
  it("sin filtros devuelve todo", () => {
    expect(applyFilters(all, NO_FILTERS)).toHaveLength(all.length);
  });

  it("sin picante excluye los platos picantes", () => {
    const ids = applyFilters(all, { ...NO_FILTERS, sinPicante: true }).map((p) => p.id);
    expect(ids).not.toContain(4);
  });

  it("combina vegetariano, para niños y para compartir como “cualquiera de”", () => {
    const ids = applyFilters(all, { ...NO_FILTERS, tags: ["vegetariano", "ninos"] }).map(
      (p) => p.id,
    );
    expect(ids).toEqual([3, 6]);
  });

  it("hasta S/ 40 usa el precio “desde”", () => {
    const ids = applyFilters(all, { ...NO_FILTERS, maxPriceCents: 4000 }).map((p) => p.id);
    expect(ids).toEqual([1, 3, 6]);
  });

  it("aplica la búsqueda junto con los filtros", () => {
    const ids = applyFilters(all, { ...NO_FILTERS, query: "seviche", sinPicante: true }).map(
      (p) => p.id,
    );
    expect(ids).toEqual([1, 3, 5]);
  });
});
