import type { Dish } from "@/features/carta/schema";
import { previewProducts } from "@/features/promotions/preview";
import type { Promotion } from "@/features/promotions/schema";

import type { DemoWebPromos } from "./apply-promos";
import { loadDemoPromos } from "./promo-storage";
import { seedDishes, seedPromotions } from "./seed";

/**
 * Promociones del modo demostración para la web pública: las que se crearon en el panel de
 * demostración en este navegador o, si no hay, las de ejemplo.
 */
export function demoWebPromos(now: number): DemoWebPromos {
  const saved = loadDemoPromos();
  const dishes = saved?.dishes ?? seedDishes();
  const promotions = saved?.promotions ?? seedPromotions(dishes, now);
  const popup = previewProducts(promotions, dishes, now);
  const dishById = new Map(dishes.map((d) => [d.id, d]));
  const bySlug = new Map<string, { promo: Promotion; dish: Dish }>();
  for (const product of popup) {
    const promo = promotions.find((p) => p.id === product.promotion?.id);
    const dish = promo ? dishById.get(promo.dishId) : undefined;
    if (promo && dish) bySlug.set(product.slug, { promo, dish });
  }
  return { popup, bySlug };
}
