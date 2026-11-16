// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F0-Q4 · Revisión independiente del catálogo importado.
 *
 * Compara `data/catalog/catalog.json` (lo que se carga en Supabase) contra
 * `data/catalog/raw.json` (copia de berypez.pe). No usa el código de importación de Axel,
 * para no repetir sus mismos errores. Resultados y hallazgos: docs/qa/f0-q4-catalogo.md.
 */

interface RawPrice {
  price: string;
}
interface RawVariation {
  id: number;
  prices: RawPrice;
  is_in_stock: boolean;
}
interface RawProduct {
  id: number;
  name: string;
  prices: RawPrice;
  is_in_stock: boolean;
  variations: { id: number }[];
}
interface Variant {
  id: number;
  label: string;
  priceCents: number;
  isAvailable: boolean;
}
interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: number;
  menus: string[];
  image: { url: string; alt: string } | null;
  isAvailable: boolean;
  variants: Variant[];
}
interface Catalog {
  menus: { slug: string; name: string }[];
  categories: { id: number; slug: string; name: string }[];
  products: Product[];
}
interface Raw {
  products: RawProduct[];
  variations: RawVariation[];
}

const root = process.cwd();
const read = <T>(file: string): T =>
  JSON.parse(readFileSync(path.join(root, "data/catalog", file), "utf8")) as T;

const catalog = read<Catalog>("catalog.json");
const raw = read<Raw>("raw.json");
const rawProducts = new Map(raw.products.map((p) => [p.id, p]));
const rawVariations = new Map(raw.variations.map((v) => [v.id, v]));

/** Texto que el cliente ve de cada producto. */
const visibleText = (p: Product) =>
  [p.name, p.description, ...p.variants.map((v) => v.label)].join("\n");

// Excepciones ya conocidas y avisadas: si cambian, la prueba falla y hay que revisarlas.
const SIN_FOTO_CONOCIDOS = ["Dúo vegetariano"];
// QA-002 (corregido): la fuente se llama «Fuente de arroz con mariscos». Ya no hay repetidos.
const NOMBRES_REPETIDOS_CONOCIDOS: string[] = [];

describe("Catálogo importado · cantidad y estructura", () => {
  it("tiene 107 productos y las 6 cartas", () => {
    expect(catalog.products).toHaveLength(107);
    expect(catalog.menus.map((m) => m.slug)).toEqual([
      "marina",
      "criolla",
      "berycafe",
      "piqueos",
      "el-bar",
      "vegetariana",
    ]);
  });

  it("cada carta tiene productos", () => {
    for (const menu of catalog.menus) {
      const n = catalog.products.filter((p) => p.menus.includes(menu.slug)).length;
      expect(n, `la carta ${menu.slug} está vacía`).toBeGreaterThan(0);
    }
  });

  it("ids y slugs de productos son únicos", () => {
    const ids = catalog.products.map((p) => p.id);
    const slugs = catalog.products.map((p) => p.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("Catálogo importado · limpieza", () => {
  it("no quedó «(Copiar)» ni «Nov 24» en ningún texto visible", () => {
    const sucios = catalog.products.filter((p) => /\(copiar\)|nov\s?24/i.test(visibleText(p)));
    expect(sucios.map((p) => p.name)).toEqual([]);
  });

  it("no existe la sección «Nov 24» ni «Sin categorizar»", () => {
    const nombres = catalog.categories.map((c) => c.name.toLowerCase());
    expect(nombres).not.toContain("nov 24");
    expect(nombres).not.toContain("sin categorizar");
  });

  it("el único producto de berypez.pe que no se importa es el duplicado «(Copiar)»", () => {
    const catalogIds = new Set(catalog.products.map((p) => p.id));
    const omitidos = raw.products.filter((p) => !catalogIds.has(p.id)).map((p) => p.name);
    expect(omitidos).toEqual(["Ceviche de conchas negras (Copiar)"]);
  });

  it("no hay productos que no existan en berypez.pe", () => {
    expect(catalog.products.filter((p) => !rawProducts.has(p.id)).map((p) => p.name)).toEqual([]);
  });

  it("no hay caracteres rotos, HTML ni entidades en los textos", () => {
    const rotos = catalog.products.filter((p) =>
      /�|<\/?[a-z][^>]*>|&[a-z]+;|&#\d+;/i.test(visibleText(p)),
    );
    expect(rotos.map((p) => p.name)).toEqual([]);
  });

  it("no hay nombres con espacios sobrantes ni descripciones vacías", () => {
    for (const p of catalog.products) {
      expect(p.name, `nombre con espacios: «${p.name}»`).toBe(
        p.name.trim().replace(/\s{2,}/g, " "),
      );
      expect(p.description.trim(), `${p.name} sin descripción`).not.toBe("");
    }
  });

  it("los nombres repetidos son solo los ya conocidos", () => {
    const cuenta = new Map<string, number>();
    for (const p of catalog.products) {
      const k = p.name.toLowerCase();
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    }
    const repetidos = [...cuenta].filter(([, n]) => n > 1).map(([k]) => k);
    expect(repetidos).toEqual(NOMBRES_REPETIDOS_CONOCIDOS);
  });
});

describe("Catálogo importado · categorías, precios y variantes", () => {
  it("todo producto está en alguna carta y en una sección existente", () => {
    const secciones = new Set(catalog.categories.map((c) => c.id));
    for (const p of catalog.products) {
      expect(p.menus.length, `${p.name} no está en ninguna carta`).toBeGreaterThan(0);
      expect(secciones.has(p.categoryId), `${p.name} con sección inexistente`).toBe(true);
    }
  });

  it("no hay secciones vacías", () => {
    for (const c of catalog.categories) {
      const n = catalog.products.filter((p) => p.categoryId === c.id).length;
      expect(n, `la sección ${c.name} está vacía`).toBeGreaterThan(0);
    }
  });

  it("el precio de cada producto coincide con berypez.pe", () => {
    const distintos = catalog.products
      .filter((p) => p.variants.length === 0)
      .filter((p) => Number(rawProducts.get(p.id)?.prices.price) !== p.priceCents)
      .map((p) => p.name);
    expect(distintos).toEqual([]);
  });

  it("los precios son enteros positivos y razonables (S/ 3 a S/ 200)", () => {
    for (const p of catalog.products) {
      expect(Number.isInteger(p.priceCents), `${p.name}: precio no entero`).toBe(true);
      expect(p.priceCents, `${p.name}: precio fuera de rango`).toBeGreaterThanOrEqual(300);
      expect(p.priceCents, `${p.name}: precio fuera de rango`).toBeLessThanOrEqual(20000);
      for (const v of p.variants) {
        expect(v.priceCents, `${p.name} / ${v.label}`).toBeGreaterThanOrEqual(300);
        expect(v.priceCents, `${p.name} / ${v.label}`).toBeLessThanOrEqual(20000);
      }
    }
  });

  it("las variantes de cada producto son las mismas de berypez.pe, con su precio y stock", () => {
    const problemas: string[] = [];
    for (const p of catalog.products) {
      const esperadas = (rawProducts.get(p.id)?.variations ?? []).map((v) => v.id).sort();
      const actuales = p.variants.map((v) => v.id).sort();
      if (esperadas.join() !== actuales.join()) problemas.push(`${p.name}: variantes distintas`);
      for (const v of p.variants) {
        const original = rawVariations.get(v.id);
        if (!original) problemas.push(`${p.name} / ${v.label}: no existe en berypez.pe`);
        else if (Number(original.prices.price) !== v.priceCents)
          problemas.push(`${p.name} / ${v.label}: precio distinto`);
        else if (original.is_in_stock !== v.isAvailable)
          problemas.push(`${p.name} / ${v.label}: stock distinto`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it("la disponibilidad de cada producto coincide con berypez.pe", () => {
    const distintos = catalog.products
      .filter((p) => rawProducts.get(p.id)?.is_in_stock !== p.isAvailable)
      .map((p) => p.name);
    expect(distintos).toEqual([]);
  });
});

describe("Catálogo importado · fotos", () => {
  it("cada foto declarada existe en public/ y tiene texto alternativo", () => {
    for (const p of catalog.products.filter((x) => x.image)) {
      const archivo = path.join(root, "public", p.image!.url);
      expect(existsSync(archivo), `${p.name}: falta ${p.image!.url}`).toBe(true);
      expect(p.image!.alt.trim(), `${p.name}: foto sin texto alternativo`).not.toBe("");
    }
  });

  it("los productos sin foto son solo los ya conocidos", () => {
    const sinFoto = catalog.products.filter((p) => !p.image).map((p) => p.name);
    expect(sinFoto).toEqual(SIN_FOTO_CONOCIDOS);
  });
});
