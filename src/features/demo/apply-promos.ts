import type { Dish } from "@/features/carta/schema";
import { byRelevance } from "@/features/promotions/pricing";
import { toProductPromotion } from "@/features/promotions/preview";
import type { Promotion } from "@/features/promotions/schema";
import type { MenuPage, Product } from "@/types/catalog";

/**
 * Promociones del modo demostración ya listas para la web. Se usan solo mientras la base no
 * tenga promociones reales (ver `PromoPopup` y `MenuBrowser`).
 */
export type DemoWebPromos = {
  /** Diapositivas de la ventana emergente, en orden (la destacada primero). */
  popup: Product[];
  /** Promoción vigente por slug del plato, en el mismo orden. */
  bySlug: Map<string, { promo: Promotion; dish: Dish }>;
};

/** El plato real con la promoción de demostración puesta (o sin cambios si no tiene). */
function withPromotion(product: Product, data: DemoWebPromos): Product {
  const entry = data.bySlug.get(product.slug);
  if (!entry) return product;
  const { promo, dish } = entry;
  let variantId: number | null = null;
  if (promo.variantId !== null) {
    // Las opciones de ejemplo tienen otros ids: se emparejan por nombre («Cabrilla»…).
    const label = dish.priceGroup?.options.find((o) => o.id === promo.variantId)?.label;
    const real = product.variants.find((v) => v.label === label);
    if (!real) return product;
    variantId = real.id;
  }
  return { ...product, promotion: { ...toProductPromotion(promo), variantId } };
}

/** La carta con las promociones de demostración aplicadas y la franja en el orden del carrusel. */
export function applyDemoPromotions(
  page: MenuPage,
  data: DemoWebPromos,
): { page: MenuPage; promoted: Product[] } {
  const sections = page.sections.map((section) => ({
    ...section,
    products: section.products.map((p) => withPromotion(p, data)),
  }));
  const seen = new Set<string>();
  const promoted = sections
    .flatMap((s) => s.products)
    .filter((p) => p.promotion && !seen.has(p.slug) && seen.add(p.slug))
    .sort((a, b) => {
      const pa = data.bySlug.get(a.slug)?.promo;
      const pb = data.bySlug.get(b.slug)?.promo;
      return pa && pb ? byRelevance(pa, pb) : 0;
    });
  return { page: { ...page, sections }, promoted };
}
