/** F1-10 · Lógica de la vista rápida: variante, elecciones, precio y paso al carrito. */
import type { CartLineInput } from "@/features/cart/cart";
import { promotionApplies, promoUnitPrice } from "@/features/promotions/pricing";
import type { ChoiceGroup, Product, Variant } from "@/types/catalog";

export type Selection = { variantId: number | null; choices: Record<string, string> };

function findVariant(product: Product, variantId: number | null): Variant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

export function defaultSelection(product: Product): Selection {
  const first = product.variants.find((v) => v.isAvailable) ?? product.variants[0];
  return { variantId: first?.id ?? null, choices: {} };
}

/** Precio sin promoción de la opción elegida (o del plato). */
export function regularUnitPriceCents(product: Product, variantId: number | null): number {
  return findVariant(product, variantId)?.priceCents ?? product.priceCents;
}

/** Precio que se cobra por unidad: con la promoción vigente, si aplica a esa opción. */
export function unitPriceCents(product: Product, variantId: number | null): number {
  return promoUnitPrice(regularUnitPriceCents(product, variantId), product.promotion, variantId);
}

/** ¿Esta opción del plato está en 2×1? */
export function isTwoForOne(product: Product, variantId: number | null): boolean {
  return (
    product.promotion?.kind === "two_for_one" && promotionApplies(product.promotion, variantId)
  );
}

/** Grupos que la persona debe elegir: los que la variante no deja fijos. */
export function visibleChoiceGroups(product: Product, variantId: number | null): ChoiceGroup[] {
  const variant = findVariant(product, variantId);
  return product.choiceGroups.filter((group) => (variant?.selections[group.key] ?? null) === null);
}

/** Rótulos de los grupos sin elegir, para avisar qué falta. */
export function missingChoices(
  product: Product,
  variantId: number | null,
  choices: Record<string, string>,
): string[] {
  return visibleChoiceGroups(product, variantId)
    .filter((group) => !group.options.includes(choices[group.key] ?? ""))
    .map((group) => group.label);
}

export function canAddToCart(product: Product, selection: Selection): boolean {
  if (!product.isAvailable) return false;
  if (product.variants.length > 0) {
    const variant = findVariant(product, selection.variantId);
    if (!variant?.isAvailable) return false;
  }
  return missingChoices(product, selection.variantId, selection.choices).length === 0;
}

export function toCartInput(product: Product, selection: Selection, note: string): CartLineInput {
  const variant = findVariant(product, selection.variantId);
  const visibleKeys = new Set(visibleChoiceGroups(product, selection.variantId).map((g) => g.key));
  const choices = Object.fromEntries(
    Object.entries(selection.choices).filter(([key]) => visibleKeys.has(key)),
  );
  return {
    productId: product.id,
    productSlug: product.slug,
    name: product.name,
    variantId: variant?.id ?? null,
    variantLabel: product.variants.length > 1 ? (variant?.label ?? null) : null,
    choices,
    note,
    unitPriceCents: unitPriceCents(product, selection.variantId),
    imageUrl: product.image?.url ?? null,
    ...(isTwoForOne(product, selection.variantId) ? { twoForOne: true } : {}),
  };
}
