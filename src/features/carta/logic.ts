import { type Dish, MAX_PRICE_CENTS, MAX_STOCK } from "./schema";

/** Un cambio de precio mayor a este porcentaje pide confirmación (regla del plan). */
export const PRICE_CHANGE_CONFIRM_PERCENT = 40;

/** Agotado a mano o porque el stock llegó a cero. */
export function isSoldOut(dish: Pick<Dish, "isAvailable" | "stockQty">): boolean {
  return !dish.isAvailable || dish.stockQty === 0;
}

/** ¿El cambio de precio es tan grande que conviene confirmarlo? */
export function priceChangeNeedsConfirm(oldCents: number, newCents: number): boolean {
  if (oldCents <= 0) return false;
  const change = (Math.abs(newCents - oldCents) / oldCents) * 100;
  return change > PRICE_CHANGE_CONFIRM_PERCENT;
}

export type PriceResult = { ok: true; cents: number } | { ok: false; message: string };

/** Precio escrito en soles («48», «48.5», «48,50») a céntimos, con su mensaje de error. */
export function parsePriceInput(text: string): PriceResult {
  const value = Number(text.trim().replace(",", "."));
  if (text.trim() === "" || Number.isNaN(value)) {
    return { ok: false, message: "Escribe un precio en soles, por ejemplo 48.50." };
  }
  if (value <= 0) return { ok: false, message: "El precio debe ser mayor a cero." };
  const cents = Math.round(value * 100);
  if (cents > MAX_PRICE_CENTS) {
    return { ok: false, message: `El precio no puede pasar de S/ ${MAX_PRICE_CENTS / 100}.` };
  }
  return { ok: true, cents };
}

export type StockResult = { ok: true; qty: number | null } | { ok: false; message: string };

/** Stock escrito a mano; vacío = sin control de cantidad. */
export function parseStockInput(text: string): StockResult {
  if (text.trim() === "") return { ok: true, qty: null };
  const value = Number(text.trim());
  if (!Number.isInteger(value))
    return { ok: false, message: "El stock debe ser un número entero." };
  if (value < 0) return { ok: false, message: "El stock no puede ser negativo." };
  if (value > MAX_STOCK) return { ok: false, message: `El stock no puede pasar de ${MAX_STOCK}.` };
  return { ok: true, qty: value };
}

/**
 * Aplica un stock nuevo. Si llega a 0 el plato queda agotado; si se repone desde 0, vuelve a
 * estar disponible (era agotado solo por falta de stock).
 */
export function withStock(dish: Dish, qty: number | null): Dish {
  const wasEmpty = dish.stockQty === 0;
  if (qty === 0) return { ...dish, stockQty: 0, isAvailable: false };
  if (wasEmpty && qty !== null && qty > 0) return { ...dish, stockQty: qty, isAvailable: true };
  return { ...dish, stockQty: qty };
}

/** Interruptor de agotado. Marcar disponible con stock 0 no tiene sentido: pide reponer. */
export function canMarkAvailable(dish: Pick<Dish, "stockQty">): boolean {
  return dish.stockQty !== 0;
}

export type DishFilters = {
  query: string;
  category: string | null;
  onlySoldOut: boolean;
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Filtra por texto (sin tildes), categoría y «solo agotados». */
export function filterDishes(dishes: readonly Dish[], filters: DishFilters): Dish[] {
  const query = normalize(filters.query.trim());
  return dishes.filter((dish) => {
    if (filters.category && dish.category !== filters.category) return false;
    if (filters.onlySoldOut && !isSoldOut(dish)) return false;
    if (query && !normalize(`${dish.name} ${dish.description}`).includes(query)) return false;
    return true;
  });
}

export type CartaSummary = { total: number; soldOut: number; lowStock: number };

/** Stock bajo: quedan pocas porciones (≤ 5) y el plato sigue a la venta. */
export const LOW_STOCK_THRESHOLD = 5;

export function summarize(dishes: readonly Dish[]): CartaSummary {
  return {
    total: dishes.length,
    soldOut: dishes.filter(isSoldOut).length,
    lowStock: dishes.filter(
      (d) => !isSoldOut(d) && d.stockQty !== null && d.stockQty <= LOW_STOCK_THRESHOLD,
    ).length,
  };
}
