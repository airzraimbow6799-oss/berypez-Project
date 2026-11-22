import type { Product } from "@/types/catalog";

/**
 * Enlace al plato en su carta: la carta lo busca con `?plato=` y abre su vista rápida;
 * el `#` lleva a la tarjeta aunque el JavaScript todavía no cargue.
 */
export function promoHref(product: Pick<Product, "slug" | "menus">): string {
  return `/carta/${product.menus[0] ?? "marina"}?plato=${encodeURIComponent(product.slug)}#${product.slug}`;
}

/** Máximo de promociones en el carrusel de la ventana emergente. */
export const POPUP_MAX_SLIDES = 5;
