/**
 * F2-06 · Líneas del carrito (funciones puras, inmutables).
 * El precio guardado aquí es solo para mostrar: el servidor recalcula todo con
 * POST /api/cart/quote (F2-01) y nunca confía en lo que envía el navegador.
 */
import { z } from "zod";

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

const lineSchema = z.object({
  key: z.string(),
  productId: z.number().int().positive(),
  productSlug: z.string(),
  name: z.string(),
  variantId: z.number().int().positive().nullable(),
  variantLabel: z.string().nullable(),
  choices: z.record(z.string(), z.string()),
  note: z.string().max(MAX_NOTE_LENGTH),
  unitPriceCents: z.number().int().nonnegative(),
  imageUrl: z.string().nullable(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
});

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
  const result = z.array(lineSchema).safeParse(value);
  return result.success ? result.data : [];
}
