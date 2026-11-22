/**
 * F2-06 · Líneas del carrito (funciones puras, inmutables).
 * El precio guardado aquí es solo para mostrar: el servidor recalcula todo con
 * POST /api/cart/quote (F2-01) y nunca confía en lo que envía el navegador.
 */

export const MAX_QUANTITY = 50;
export const MAX_NOTE_LENGTH = 200;

export type CartLineInput = {
  productId: number;
  productSlug: string;
  name: string;
  variantId: number | null;
  variantLabel: string | null;
  /** Elecciones libres: clave del grupo → opción. */
  choices: Record<string, string>;
  note: string;
  unitPriceCents: number;
  imageUrl: string | null;
};

export type CartLine = CartLineInput & { key: string; quantity: number };

/*
 * Validación a mano, sin Zod (#58): el carrito se carga en la cabecera de todas las páginas y
 * Zod sumaba ~19–28 KB comprimidos de JavaScript a cada una solo para revisar localStorage.
 */
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNullableString = (v: unknown): v is string | null => v === null || isString(v);

function isStringRecord(v: unknown): v is Record<string, string> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v as Record<string, unknown>).every(isString)
  );
}

/** Una línea guardada válida, con solo los campos conocidos (como hacía el esquema). */
function toCartLine(value: unknown): CartLine | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  const ok =
    isString(v.key) &&
    isInt(v.productId) &&
    v.productId > 0 &&
    isString(v.productSlug) &&
    isString(v.name) &&
    (v.variantId === null || (isInt(v.variantId) && v.variantId > 0)) &&
    isNullableString(v.variantLabel) &&
    isStringRecord(v.choices) &&
    isString(v.note) &&
    v.note.length <= MAX_NOTE_LENGTH &&
    isInt(v.unitPriceCents) &&
    v.unitPriceCents >= 0 &&
    isNullableString(v.imageUrl) &&
    isInt(v.quantity) &&
    v.quantity >= 1 &&
    v.quantity <= MAX_QUANTITY;
  if (!ok) {
    return null;
  }
  return {
    key: v.key as string,
    productId: v.productId as number,
    productSlug: v.productSlug as string,
    name: v.name as string,
    variantId: v.variantId as number | null,
    variantLabel: v.variantLabel as string | null,
    choices: { ...(v.choices as Record<string, string>) },
    note: v.note as string,
    unitPriceCents: v.unitPriceCents as number,
    imageUrl: v.imageUrl as string | null,
    quantity: v.quantity as number,
  };
}

function cleanNote(note: string): string {
  return note.trim().slice(0, MAX_NOTE_LENGTH);
}

/** Identidad de una línea: mismo plato, variante, elecciones y nota = misma línea. */
export function lineKey(
  input: Pick<CartLineInput, "productId" | "variantId" | "choices" | "note">,
): string {
  const choices = Object.keys(input.choices)
    .sort()
    .map((k) => `${k}=${input.choices[k]}`)
    .join("&");
  return [input.productId, input.variantId ?? "-", choices, cleanNote(input.note)].join("|");
}

const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(quantity)));

export function addLine(
  lines: readonly CartLine[],
  input: CartLineInput,
  quantity: number,
): CartLine[] {
  const note = cleanNote(input.note);
  const key = lineKey({ ...input, note });
  const existing = lines.find((line) => line.key === key);
  if (existing) {
    return lines.map((line) =>
      line.key === key ? { ...line, quantity: clamp(line.quantity + quantity) } : line,
    );
  }
  return [...lines, { ...input, note, key, quantity: clamp(quantity) }];
}

export function setQuantity(lines: readonly CartLine[], key: string, quantity: number): CartLine[] {
  const next = clamp(quantity);
  return next === 0
    ? lines.filter((line) => line.key !== key)
    : lines.map((line) => (line.key === key ? { ...line, quantity: next } : line));
}

export function removeLine(lines: readonly CartLine[], key: string): CartLine[] {
  return lines.filter((line) => line.key !== key);
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotalCents(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
}

/** Valida lo guardado en el navegador; si algo está corrupto, empieza vacío. */
export function parseStoredLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const lines = value.map(toCartLine);
  // Como antes: si una sola línea está corrupta, se descarta todo y se empieza vacío.
  return lines.every((line): line is CartLine => line !== null) ? lines : [];
}
