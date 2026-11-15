/** Limpieza de textos del catálogo importado (Anexo B de la propuesta). */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

/** Correcciones de ortografía detectadas en la auditoría. */
const SPELLING_FIXES: ReadonlyArray<[RegExp, string]> = [
  [/\bEspaguetti\b/g, "Espagueti"],
  [/\bespaguetti\b/g, "espagueti"],
  [/\bbisteck\b/gi, "bistec"],
  [/\bbrunua\b/gi, "brunoise"],
  [/\blangotinos\b/gi, "langostinos"],
  [/\bDuos\b/g, "Dúos"],
  [/\bduos\b/g, "dúos"],
  [/\btrios\b/g, "tríos"],
  [/\bTrios\b/g, "Tríos"],
];

function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function fixSpelling(input: string): string {
  return SPELLING_FIXES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    input,
  );
}

/** Texto plano a partir del HTML de WooCommerce. */
export function cleanText(html: string): string {
  const plain = decodeEntities(html.replace(/<[^>]*>/g, " "));
  return fixSpelling(plain.replace(/\s+/g, " ").trim());
}

/** Nombre visible de un producto o categoría. */
export function cleanName(name: string): string {
  return cleanText(name)
    .replace(/\s*\(copiar\)\s*$/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function isDuplicateCopy(name: string): boolean {
  return /\(copiar\)/i.test(name);
}
