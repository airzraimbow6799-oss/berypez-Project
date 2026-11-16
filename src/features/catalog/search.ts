/**
 * F1-03 / F1-11 · Búsqueda tolerante y filtros de la carta (funciones puras).
 * - Sin tildes ni mayúsculas.
 * - Sinónimos peruanos frecuentes (“seviche”, “cebiche” → ceviche).
 * - Una letra de diferencia en palabras de 5 o más letras (“saltdo” → saltado).
 */
import type { Product, ProductTag } from "@/types/catalog";

const SYNONYMS: Readonly<Record<string, string>> = {
  seviche: "ceviche",
  cebiche: "ceviche",
  sebiche: "ceviche",
  ceviches: "ceviche",
  chaufa: "chaufa",
  chifa: "chaufa",
  parihuela: "parihuelas",
  chicharon: "chicharron",
  langostinos: "langostino",
  camarones: "camaron",
  chela: "cerveza",
  chelas: "cerveza",
  gaseosa: "gaseosa",
  refresco: "bebida",
  jugo: "jugo",
};

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, " ")
    .trim();
}

function canonical(word: string): string {
  return SYNONYMS[word] ?? word;
}

/** Distancia de edición limitada a 1 (rápida): ¿difieren en a lo sumo una letra? */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function wordMatches(term: string, words: readonly string[]): boolean {
  return words.some(
    (word) =>
      word.startsWith(term) ||
      canonical(word).startsWith(term) ||
      (term.length >= 5 &&
        withinOneEdit(term, word.slice(0, Math.max(term.length, word.length)))) ||
      (term.length >= 5 && withinOneEdit(term, word)),
  );
}

function terms(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean).map(canonical);
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

export function matchesQuery(product: Product, query: string): boolean {
  const searchTerms = terms(query);
  if (searchTerms.length === 0) return true;
  const haystack = words(`${product.name} ${product.description} ${product.variantLabel ?? ""}`);
  return searchTerms.every((term) => wordMatches(term, haystack));
}

/** Puntaje para ordenar sugerencias: el nombre pesa más que la descripción. */
export function scoreProduct(product: Product, query: string): number {
  const searchTerms = terms(query);
  const name = words(product.name);
  const description = words(product.description);
  return searchTerms.reduce(
    (score, term) =>
      score + (wordMatches(term, name) ? 3 : 0) + (wordMatches(term, description) ? 1 : 0),
    0,
  );
}

export type MenuFilters = {
  query: string;
  sinPicante: boolean;
  /** “Cualquiera de” estas etiquetas (vegetariano, niños, compartir). */
  tags: ProductTag[];
  maxPriceCents: number | null;
};

export const NO_FILTERS: MenuFilters = {
  query: "",
  sinPicante: false,
  tags: [],
  maxPriceCents: null,
};

export function applyFilters(products: readonly Product[], filters: MenuFilters): Product[] {
  return products.filter(
    (p) =>
      (!filters.sinPicante || !p.tags.includes("picante")) &&
      (filters.tags.length === 0 || filters.tags.some((tag) => p.tags.includes(tag))) &&
      (filters.maxPriceCents === null || p.priceCents <= filters.maxPriceCents) &&
      matchesQuery(p, filters.query),
  );
}

export type FilterAvailability = {
  sinPicante: boolean;
  tags: ProductTag[];
  maxPrice: boolean;
};

/**
 * QA-001 · Qué filtros sirven en esta carta. Un filtro solo se ofrece si cambia el resultado:
 * algunos platos lo cumplen y otros no. Así «Sin picante» no aparece mientras ningún plato esté
 * etiquetado como picante (F1-04, lo confirma la dueña) y aparece solo en cuanto se etiqueten.
 */
export function availableFilters(
  products: readonly Product[],
  tags: readonly ProductTag[],
  maxPriceCents: number,
): FilterAvailability {
  const splits = (matches: (p: Product) => boolean) => {
    const count = products.filter(matches).length;
    return count > 0 && count < products.length;
  };
  return {
    sinPicante: splits((p) => p.tags.includes("picante")),
    tags: tags.filter((tag) => splits((p) => p.tags.includes(tag))),
    maxPrice: splits((p) => p.priceCents <= maxPriceCents),
  };
}
