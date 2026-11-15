/**
 * Contenido curado de la portada (F1-06/F1-07). Son slugs del catálogo: si un plato se
 * despublica, simplemente no aparece. La dueña puede cambiar la selección aquí.
 */
import type { MenuSlug } from "@/types/catalog";

/** Plato estrella del HERO (propuesta §8: “El favorito: Ceviche Berypez”). */
export const FEATURED_PRODUCT_SLUG = "ceviche-berypez";

/** Foto de portada de cada carta. */
export const MENU_COVERS: Readonly<Record<MenuSlug, string>> = {
  marina: "ceviche-berypez",
  criolla: "lomo-saltado",
  berycafe: "pan-con-pejerrey",
  piqueos: "causa-acevichada",
  "el-bar": "pisco-sour",
  vegetariana: "ceviche-de-champinones",
};

/** Recomendados de la casa. No dice “lo más pedido” hasta tener datos reales de ventas. */
export const HOUSE_PICKS: readonly string[] = [
  "parihuelas",
  "arroz-con-mariscos",
  "chicharron-mixto",
  "lomo-saltado",
];

/** Dúos y tríos para compartir (propuesta §8: combos y promociones). */
export const COMBO_SLUGS: readonly string[] = [
  "duo-de-infarto",
  "trio-con-causa",
  "triple-marino",
  "duo-de-ceviches",
];

/** Tarifa de delivery vigente mientras la dueña define las zonas (README F2-02). */
export const DELIVERY_FEE_FROM_CENTS = 750;
