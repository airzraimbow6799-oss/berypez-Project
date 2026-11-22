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
