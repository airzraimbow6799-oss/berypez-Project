/**
 * Contrato de datos v1 · Catálogo (F0-05).
 *
 * Fuente de verdad de los tipos que comparten la UI, la API interna y los mocks.
 * Todo monto se expresa en céntimos enteros (`priceCents`) para evitar errores
 * de coma flotante: S/ 42.50 → 4250.
 */

export const MENU_SLUGS = [
  "marina",
  "criolla",
  "berycafe",
  "piqueos",
  "el-bar",
  "vegetariana",
] as const;
export type MenuSlug = (typeof MENU_SLUGS)[number];

export const PRODUCT_TAGS = [
  "picante",
  "vegetariano",
  "compartir",
  "favorito",
  "ninos",
  "nuevo",
] as const;
export type ProductTag = (typeof PRODUCT_TAGS)[number];

export const ALLERGENS = [
  "pescado",
  "mariscos",
  "gluten",
  "lacteos",
  "frutos-secos",
  "huevo",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

/** Una de las 6 cartas. */
export interface Menu {
  slug: MenuSlug;
  name: string;
  description: string;
  sortOrder: number;
}

/** Sección dentro de una carta (Ceviches, Arroces, Fondos…). */
export interface Category {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface ProductImage {
  /** URL absoluta (Supabase Storage) o ruta local en modo mock. */
  url: string;
  /** Texto alternativo descriptivo del plato. */
  alt: string;
}

/**
 * Elección libre que no cambia el precio (acompañamientos, capas de la causa…).
 * La persona debe elegir un valor de cada grupo, salvo que la variante elegida
 * ya lo fije (ver `Variant.selections`).
 */
export interface ChoiceGroup {
  /** Nombre del atributo de origen, estable. */
  key: string;
  /** Rótulo claro para la UI: “Elige tu primer acompañamiento”. */
  label: string;
  options: string[];
}

/** Combinación con precio propio: “Cabrilla” S/ 58, “1/2 fuente (2 porc.)”… */
export interface Variant {
  id: number;
  label: string;
  priceCents: number;
  isAvailable: boolean;
  /**
   * Valor fijo de cada atributo para esta variante. `null` = libre: la persona
   * lo elige en el `ChoiceGroup` con la misma `key`.
   */
  selections: Record<string, string | null>;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  /** Precio base; si tiene variantes, el mínimo (“desde”). */
  priceCents: number;
  /** Rótulo del selector de variantes: “Elige tu pescado”. `null` si no tiene. */
  variantLabel: string | null;
  categoryId: number;
  menus: MenuSlug[];
  image: ProductImage | null;
  tags: ProductTag[];
  allergens: Allergen[];
  /** Porción en texto libre: “para 2 personas”. */
  portion: string | null;
  isAvailable: boolean;
  variants: Variant[];
  choiceGroups: ChoiceGroup[];
}

/** Sección de una carta con sus productos, en orden. */
export interface MenuSection {
  category: Category;
  products: Product[];
}

/** Lo que necesita la página de una carta: la carta, las 6 pestañas y las secciones. */
export interface MenuPage {
  menu: Menu;
  menus: Menu[];
  sections: MenuSection[];
}

export interface Catalog {
  menus: Menu[];
  categories: Category[];
  products: Product[];
}
