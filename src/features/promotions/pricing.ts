/**
 * Precio con promoción. Funciones puras que usan igual la web (para mostrar) y el servidor
 * (para cobrar): el navegador nunca decide el precio.
 */
import type { ProductPromotion } from "@/types/catalog";

type PromoRule = Pick<ProductPromotion, "kind" | "percentOff" | "priceCents" | "variantId">;

/** ¿La promoción aplica a esta opción del plato? (precio fijo puede ser de una sola opción). */
export function promotionApplies(promo: PromoRule | null | undefined, variantId: number | null) {
  if (!promo) return false;
  return promo.variantId === null || promo.variantId === variantId;
}

/** Precio unitario con descuento (porcentaje o precio fijo). En 2×1 el unitario no cambia. */
export function promoUnitPrice(
  regularCents: number,
  promo: PromoRule | null | undefined,
  variantId: number | null,
): number {
  if (!promo || !promotionApplies(promo, variantId)) return regularCents;
  if (promo.kind === "percent" && promo.percentOff !== null) {
    // Redondeado a 10 céntimos: S/ 38.40 y no S/ 38.37.
    return Math.round((regularCents * (100 - promo.percentOff)) / 1000) * 10;
  }
  if (promo.kind === "fixed_price" && promo.priceCents !== null) {
    return Math.min(regularCents, promo.priceCents);
  }
  return regularCents;
}

/** Cuántas unidades se cobran: en 2×1, de cada 2 iguales se paga 1. */
export function paidQuantity(
  promo: PromoRule | null | undefined,
  variantId: number | null,
  quantity: number,
): number {
  if (promo?.kind === "two_for_one" && promotionApplies(promo, variantId)) {
    return Math.ceil(quantity / 2);
  }
  return quantity;
}

/** Texto corto para la etiqueta: «−20 %», «A S/ 35», «2×1». */
export function promoBadge(promo: PromoRule, formatPrice: (cents: number) => string): string {
  if (promo.kind === "percent") return `−${promo.percentOff} %`;
  if (promo.kind === "fixed_price") return `A ${formatPrice(promo.priceCents ?? 0)}`;
  return "2×1";
}

type Dated = Pick<ProductPromotion, "startsAt" | "endsAt" | "isFeatured"> & {
  isActive: boolean;
  createdAt?: string;
};

/** Vigente ahora: activa y dentro de sus fechas (si las tiene). */
export function isPromotionLive(promo: Dated, now: number): boolean {
  if (!promo.isActive) return false;
  if (promo.startsAt && Date.parse(promo.startsAt) > now) return false;
  if (promo.endsAt && Date.parse(promo.endsAt) <= now) return false;
  return true;
}

/** Orden de relevancia: primero las destacadas, luego las que terminan antes, luego las nuevas. */
export function byRelevance(a: Dated, b: Dated): number {
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
  const endA = a.endsAt ? Date.parse(a.endsAt) : Number.POSITIVE_INFINITY;
  const endB = b.endsAt ? Date.parse(b.endsAt) : Number.POSITIVE_INFINITY;
  if (endA !== endB) return endA - endB;
  return Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0");
}

type Priced = {
  priceCents: number;
  variants: ReadonlyArray<{ id: number; priceCents: number; isAvailable?: boolean }>;
  promotion?: ProductPromotion | null;
};

/**
 * Lo que muestra la tarjeta: precio normal y precio con promoción («desde» si hay opciones).
 * En 2×1 el precio no cambia (la etiqueta lo dice).
 */
export function cardPrices(product: Priced): {
  regularCents: number;
  promoCents: number;
  isFrom: boolean;
} {
  const options =
    product.variants.length > 0
      ? product.variants.map((v) => ({ id: v.id as number | null, price: v.priceCents }))
      : [{ id: null, price: product.priceCents }];
  const promo = product.promotion ?? null;
  // Precio fijo de UNA opción: se muestra esa opción (es la que está en oferta).
  const shown =
    promo?.kind === "fixed_price" && promo.variantId !== null
      ? options.filter((o) => o.id === promo.variantId)
      : options;
  const list = shown.length > 0 ? shown : options;
  return {
    regularCents: Math.min(...list.map((o) => o.price)),
    promoCents: Math.min(...list.map((o) => promoUnitPrice(o.price, promo, o.id))),
    isFrom: list.length > 1,
  };
}
