import { slugify } from "@/features/carta/bridge";
import type { Dish } from "@/features/carta/schema";
import type { Product } from "@/types/catalog";

import { byRelevance, isPromotionLive } from "./pricing";
import type { Promotion } from "./schema";

/**
 * Lo que mostraría la ventana emergente con estas promociones y platos: solo las vigentes,
 * una por plato (la más relevante) y en el orden del carrusel. Sirve para la vista previa
 * del panel, donde los datos aún no vienen de la web.
 */
export function previewProducts(
  promotions: readonly Promotion[],
  dishes: readonly Dish[],
  now: number,
): Product[] {
  const dishById = new Map(dishes.map((d) => [d.id, d]));
  const seen = new Set<number>();
  return promotions
    .filter((p) => isPromotionLive(p, now) && dishById.has(p.dishId))
    .sort(byRelevance)
    .flatMap((p) => {
      if (seen.has(p.dishId)) return [];
      seen.add(p.dishId);
      return [dishToPromoProduct(dishById.get(p.dishId)!, p)];
    });
}

function dishToPromoProduct(dish: Dish, promo: Promotion): Product {
  const slug = slugify(dish.name);
  return {
    id: dish.id,
    slug,
    name: dish.name,
    description: dish.description,
    priceCents: dish.priceCents,
    variantLabel: dish.priceGroup?.label ?? null,
    categoryId: 0,
    menus: dish.menus,
    image: dish.image ? { url: dish.image.url, alt: dish.image.alt } : null,
    tags: dish.tags,
    allergens: [],
    portion: null,
    isAvailable: dish.isAvailable,
    variants: (dish.priceGroup?.options ?? []).map((o, i) => ({
      id: o.id ?? -(i + 1),
      label: o.label,
      priceCents: o.priceCents,
      isAvailable: true,
      selections: {},
    })),
    choiceGroups: [],
    promotion: {
      id: promo.id,
      kind: promo.kind,
      percentOff: promo.percentOff,
      priceCents: promo.priceCents,
      variantId: promo.variantId,
      title: promo.title,
      imageUrl: promo.image?.url ?? null,
      isFeatured: promo.isFeatured,
      startsAt: promo.startsAt,
      endsAt: promo.endsAt,
    },
  };
}
