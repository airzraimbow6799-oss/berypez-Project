import { MAX_PRICE_CENTS, type Dish } from "./schema";

import type { MenuSlug } from "@/types/catalog";

/** Un cambio de precio mayor a este porcentaje pide confirmación (regla del plan). */
export const PRICE_CHANGE_CONFIRM_PERCENT = 40;

/** Sin stock: un plato está agotado solo cuando el equipo lo marca así. */
export function isSoldOut(dish: Pick<Dish, "isAvailable">): boolean {
  return !dish.isAvailable;
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

export type DishFilters = {
  query: string;
  menu: MenuSlug | null;
  onlySoldOut: boolean;
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Texto donde se busca: nombre, descripción, sección, etiquetas y opciones de los apartados. */
function searchableText(dish: Dish): string {
  return [
    dish.name,
    dish.description,
    dish.section,
    ...dish.tags,
    ...(dish.priceGroup?.options.map((o) => o.label) ?? []),
    ...dish.choiceGroups.flatMap((g) => g.options),
  ].join(" ");
}

/** Filtra por texto (sin tildes), carta y «solo agotados». */
export function filterDishes(dishes: readonly Dish[], filters: DishFilters): Dish[] {
  const query = normalize(filters.query.trim());
  return dishes.filter((dish) => {
    if (filters.menu && !dish.menus.includes(filters.menu)) return false;
    if (filters.onlySoldOut && !isSoldOut(dish)) return false;
    if (query && !normalize(searchableText(dish)).includes(query)) return false;
    return true;
  });
}

export type CartaSummary = { total: number; soldOut: number; withOptions: number };

export function summarize(dishes: readonly Dish[]): CartaSummary {
  return {
    total: dishes.length,
    soldOut: dishes.filter(isSoldOut).length,
    withOptions: dishes.filter((d) => d.priceGroup !== null || d.choiceGroups.length > 0).length,
  };
}

/** Un plato con apartado con precio se edita desde su formulario, no con el precio rápido. */
export function hasPriceOptions(dish: Pick<Dish, "priceGroup">): boolean {
  return dish.priceGroup !== null;
}
