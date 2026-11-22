import type { Dish } from "@/features/carta/schema";
import type { Promotion } from "@/features/promotions/schema";

/**
 * Promociones y platos del modo demostración guardados en este navegador. Así lo que se crea
 * en el panel de demostración sobrevive a la recarga y la web (Inicio y carta) lo muestra.
 */
export type SavedDemoPromos = { promotions: Promotion[]; dishes: Dish[] };

export const DEMO_PROMOS_KEY = "berypez_demo_promociones_v1";

function storage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadDemoPromos(): SavedDemoPromos | null {
  try {
    const raw = storage()?.getItem(DEMO_PROMOS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedDemoPromos>;
    if (!Array.isArray(data.promotions) || !Array.isArray(data.dishes)) return null;
    return { promotions: data.promotions, dishes: data.dishes };
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo guardar (navegador privado o sin espacio por fotos grandes). */
export function saveDemoPromos(data: SavedDemoPromos): boolean {
  try {
    storage()?.setItem(DEMO_PROMOS_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearDemoPromos(): void {
  try {
    storage()?.removeItem(DEMO_PROMOS_KEY);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
