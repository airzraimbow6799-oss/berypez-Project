import { describe, expect, it } from "vitest";

import type { RawCatalog, RawProduct, RawVariation } from "./woo-schema";
import { normalizeCatalog } from "./transform";

const cat = (id: number, slug: string, name: string) => ({ id, slug, name });

function product(
  overrides: Partial<RawProduct> & Pick<RawProduct, "id" | "name" | "slug">,
): RawProduct {
  return {
    type: "simple",
    description: "<p>Rico plato.</p>",
    short_description: "",
    prices: { price: "3000", currency_minor_unit: 2 },
    images: [{ src: "https://berypez.pe/wp-content/uploads/foto.webp", alt: "" }],
    categories: [],
    attributes: [],
    variations: [],
    is_in_stock: true,
    ...overrides,
  };
}

function variation(id: number, parent: number, price: string): RawVariation {
  return { id, parent, prices: { price, currency_minor_unit: 2 }, is_in_stock: true };
}

function raw(products: RawProduct[], variations: RawVariation[] = []): RawCatalog {
  return {
    categories: [
      cat(69, "marino", "Marino"),
      cat(70, "criollo", "Criollo"),
      cat(62, "los-vegetarianos", "Los vegetarianos"),
      cat(73, "ceviches", "Ceviches"),
      cat(63, "parihuelas", "Parihuelas"),
      cat(59, "duos-y-trios", "Duos y trios"),
      cat(84, "gaseosas", "Gaseosas"),
      cat(77, "piqueos", "Piqueos"),
      cat(60, "fondos", "Fondos"),
      cat(85, "cervezas", "Cervezas"),
      cat(103, "nov-24", "Nov 24"),
    ],
    products,
    variations,
  };
}

describe("normalizeCatalog", () => {
  it("crea las 6 cartas en orden", () => {
    const { menus } = normalizeCatalog(raw([]));
    expect(menus.map((m) => m.slug)).toEqual([
      "marina",
      "criolla",
      "berycafe",
      "piqueos",
      "el-bar",
      "vegetariana",
    ]);
  });

  it("convierte precios a céntimos enteros y limpia textos", () => {
    const { products } = normalizeCatalog(
      raw([
        product({
          id: 1,
          name: "Ceviche",
          slug: "ceviche",
          categories: [cat(69, "marino", ""), cat(73, "ceviches", "")],
        }),
      ]),
    );
    expect(products[0]).toMatchObject({
      priceCents: 3000,
      description: "Rico plato.",
      menus: ["marina"],
    });
  });

  it("descarta los productos duplicados “(Copiar)”", () => {
    const { products } = normalizeCatalog(
      raw([
        product({
          id: 1,
          name: "Ceviche de conchas negras",
          slug: "a",
          categories: [cat(73, "ceviches", "")],
        }),
        product({
          id: 2,
          name: "Ceviche de conchas negras (Copiar)",
          slug: "a-copiar",
          categories: [cat(73, "ceviches", "")],
        }),
      ]),
    );
    expect(products.map((p) => p.id)).toEqual([1]);
  });

  it("elimina la categoría residual Nov 24 y usa la subcategoría real", () => {
    const { products, categories } = normalizeCatalog(
      raw([
        product({
          id: 1,
          name: "Ceviche de pesca del día",
          slug: "c",
          categories: [cat(73, "ceviches", ""), cat(69, "marino", ""), cat(103, "nov-24", "")],
        }),
      ]),
    );
    expect(categories.map((c) => c.slug)).not.toContain("nov-24");
    expect(products[0]?.categoryId).toBe(73);
  });

  it("asigna categoría a productos sin categoría por su slug (Gaseosas)", () => {
    const { products } = normalizeCatalog(
      raw([product({ id: 154, name: "Gaseosas", slug: "gaseosas" })]),
    );
    expect(products[0]).toMatchObject({ categoryId: 84, menus: ["berycafe", "el-bar"] });
  });

  it("deja fuera las categorías sin productos", () => {
    const { categories } = normalizeCatalog(
      raw([product({ id: 1, name: "Ceviche", slug: "c", categories: [cat(73, "ceviches", "")] })]),
    );
    expect(categories.map((c) => c.slug)).toEqual(["ceviches"]);
  });

  it("marca vegetariano y usa la categoría vegetariana como respaldo", () => {
    const { products, categories } = normalizeCatalog(
      raw([
        product({
          id: 355,
          name: "Arroz arrisotado",
          slug: "arroz",
          categories: [cat(70, "criollo", ""), cat(62, "los-vegetarianos", "")],
        }),
      ]),
    );
    expect(products[0]).toMatchObject({
      categoryId: 62,
      menus: ["criolla", "vegetariana"],
      tags: ["vegetariano"],
    });
    expect(categories[0]?.name).toBe("Vegetarianos");
  });

  it("arma variantes con precio, rótulo claro y precio “desde”", () => {
    const parihuela = product({
      id: 300,
      name: "Parihuelas",
      slug: "parihuelas",
      type: "variable",
      prices: { price: "4200", currency_minor_unit: 2 },
      categories: [cat(69, "marino", ""), cat(63, "parihuelas", "")],
      attributes: [
        {
          name: "Hecho de",
          terms: [
            { name: "Cabrilla", slug: "Cabrilla" },
            { name: "Pesca del día (filete)", slug: "Pesca del día (filete)" },
          ],
        },
      ],
      variations: [
        { id: 302, attributes: [{ name: "Hecho de", value: "Cabrilla" }] },
        { id: 301, attributes: [{ name: "Hecho de", value: "Pesca del día (filete)" }] },
      ],
    });
    const { products } = normalizeCatalog(
      raw([parihuela], [variation(301, 300, "4200"), variation(302, 300, "5800")]),
    );
    const p = products[0];
    expect(p?.variantLabel).toBe("Elige tu pescado");
    expect(p?.priceCents).toBe(4200);
    expect(p?.variants.map((v) => [v.label, v.priceCents])).toEqual([
      ["Pesca del día (filete)", 4200],
      ["Cabrilla", 5800],
    ]);
    expect(p?.choiceGroups).toEqual([]);
  });

  it("convierte los atributos libres en grupos de elección", () => {
    const milanesa = product({
      id: 541,
      name: "Milanesa de pollo",
      slug: "milanesa",
      type: "variable",
      categories: [cat(70, "criollo", ""), cat(60, "fondos", "")],
      attributes: [
        {
          name: "Guarnición 01",
          terms: [
            { name: "Arroz", slug: "arroz" },
            { name: "Papas fritas", slug: "papas-fritas" },
          ],
        },
        { name: "Guarnición 02", terms: [{ name: "Ensalada", slug: "ensalada" }] },
      ],
      variations: [
        {
          id: 542,
          attributes: [
            { name: "Guarnición 01", value: null },
            { name: "Guarnición 02", value: null },
          ],
        },
      ],
    });
    const { products } = normalizeCatalog(raw([milanesa], [variation(542, 541, "3500")]));
    const p = products[0];
    expect(p?.choiceGroups).toEqual([
      {
        key: "Guarnición 01",
        label: "Elige tu primer acompañamiento",
        options: ["Arroz", "Papas fritas"],
      },
      { key: "Guarnición 02", label: "Elige tu segundo acompañamiento", options: ["Ensalada"] },
    ]);
    expect(p?.variantLabel).toBeNull();
    expect(p?.variants).toHaveLength(1);
    expect(p?.variants[0]).toMatchObject({ label: "Milanesa de pollo", priceCents: 3500 });
  });

  it("traduce los slugs de valores al nombre visible del término", () => {
    const gaseosas = product({
      id: 154,
      name: "Gaseosas",
      slug: "gaseosas",
      type: "variable",
      attributes: [
        { name: "Marca gaseosa", terms: [{ name: "Inka Kola", slug: "inka-kola" }] },
        { name: "Tamaño", terms: [{ name: "Personal", slug: "personal" }] },
      ],
      variations: [
        {
          id: 155,
          attributes: [
            { name: "Marca gaseosa", value: "inka-kola" },
            { name: "Tamaño", value: "personal" },
          ],
        },
      ],
    });
    const { products } = normalizeCatalog(raw([gaseosas], [variation(155, 154, "700")]));
    expect(products[0]?.variants[0]?.label).toBe("Inka Kola · Personal");
  });

  it("trata un atributo mixto como elección, bloqueado cuando la variante lo fija", () => {
    const cervezas = product({
      id: 1551,
      name: "Cervezas Nacionales",
      slug: "cervezas-nacionales",
      type: "variable",
      categories: [cat(85, "cervezas", "")],
      attributes: [
        {
          name: "Cerveza",
          terms: [
            { name: "Pilsen", slug: "Pilsen" },
            { name: "Cusqueña", slug: "Cusqueña" },
          ],
        },
        {
          name: "Tamaño",
          terms: [
            { name: "Grande", slug: "Grande" },
            { name: "Chica", slug: "Chica" },
          ],
        },
      ],
      variations: [
        {
          id: 1552,
          attributes: [
            { name: "Cerveza", value: "Pilsen" },
            { name: "Tamaño", value: "Grande" },
          ],
        },
        {
          id: 1553,
          attributes: [
            { name: "Cerveza", value: null },
            { name: "Tamaño", value: "Chica" },
          ],
        },
      ],
    });
    const { products } = normalizeCatalog(
      raw([cervezas], [variation(1552, 1551, "1300"), variation(1553, 1551, "900")]),
    );
    const p = products[0];
    expect(p?.choiceGroups.map((g) => g.key)).toEqual(["Cerveza"]);
    expect(p?.variants.map((v) => [v.label, v.selections])).toEqual([
      ["Chica", { Cerveza: null, Tamaño: "Chica" }],
      ["Pilsen · Grande", { Cerveza: "Pilsen", Tamaño: "Grande" }],
    ]);
  });

  it("usa el nombre del plato como texto alternativo de la foto y null si no hay foto", () => {
    const { products } = normalizeCatalog(
      raw([
        product({ id: 1, name: "Ceviche mixto", slug: "a", categories: [cat(73, "ceviches", "")] }),
        product({
          id: 2,
          name: "Dúo vegetariano",
          slug: "b",
          images: [],
          categories: [cat(59, "duos-y-trios", "")],
        }),
      ]),
    );
    expect(products[0]?.image).toEqual({
      url: "https://berypez.pe/wp-content/uploads/foto.webp",
      alt: "Ceviche mixto",
    });
    expect(products[1]?.image).toBeNull();
  });

  it("falla con un mensaje claro si una variante no existe en el snapshot", () => {
    const p = product({
      id: 9,
      name: "X",
      slug: "x",
      type: "variable",
      categories: [cat(73, "ceviches", "")],
      attributes: [{ name: "Tamaño", terms: [{ name: "Chico", slug: "chico" }] }],
      variations: [{ id: 99, attributes: [{ name: "Tamaño", value: "chico" }] }],
    });
    expect(() => normalizeCatalog(raw([p]))).toThrow("variante 99");
  });

  it("falla si un producto queda sin categoría", () => {
    expect(() =>
      normalizeCatalog(raw([product({ id: 5, name: "Misterio", slug: "misterio" })])),
    ).toThrow("sin categoría: Misterio");
  });
});
