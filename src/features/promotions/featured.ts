import { type Promotion, type PromotionData, promotionStatus } from "./schema";

/**
 * Reglas de la promoción destacada (la estrella): sale primero en la ventana emergente.
 * - Solo puede haber UNA destacada: al destacar una, la anterior deja de serlo.
 * - Solo se destaca una promoción activa hoy (no pausada, programada ni vencida).
 * Las mismas reglas corren en el modo demostración y en el servidor (acciones del panel).
 */

export function canFeature(promo: Promotion, now: number): boolean {
  return promotionStatus(promo, now) === "activa";
}

/** Los datos que se van a guardar: si la promoción no queda activa hoy, no puede ir destacada. */
export function normalizeFeatured(data: PromotionData, now: number): PromotionData {
  if (!data.isFeatured) return data;
  const asPromotion: Promotion = { ...data, id: 0, createdAt: new Date(now).toISOString() };
  return canFeature(asPromotion, now) ? data : { ...data, isFeatured: false };
}

/** Lista después de guardar la promoción `savedId`: si quedó destacada, las demás dejan de serlo. */
export function keepSingleFeatured(promotions: Promotion[], savedId: number): Promotion[] {
  const saved = promotions.find((p) => p.id === savedId);
  if (!saved?.isFeatured) return promotions;
  return promotions.map((p) =>
    p.id !== savedId && p.isFeatured ? { ...p, isFeatured: false } : p,
  );
}

/**
 * Cambia una bandera respetando las reglas. Devuelve la lista nueva, o `null` si no se puede
 * (destacar una promoción que no está activa).
 */
export function applyFlag(
  promotions: Promotion[],
  id: number,
  flag: "isActive" | "isFeatured",
  value: boolean,
  now: number,
): Promotion[] | null {
  const target = promotions.find((p) => p.id === id);
  if (!target) return promotions;
  if (flag === "isFeatured") {
    if (value && !canFeature(target, now)) return null;
    return promotions.map((p) => {
      if (p.id === id) return { ...p, isFeatured: value };
      return value && p.isFeatured ? { ...p, isFeatured: false } : p;
    });
  }
  // Pausar quita la estrella: una promoción pausada no sale en la ventana.
  return promotions.map((p) =>
    p.id === id ? { ...p, isActive: value, isFeatured: value ? p.isFeatured : false } : p,
  );
}
