/**
 * F0-11 · Datos fijos del catálogo para tests (formas reales de las filas de Supabase).
 * Tomados del catálogo importado: Parihuelas (variantes), Milanesa (elecciones libres)
 * y Causa de verduras (vegetariana, sin variantes).
 */
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
export type ProductRow = Tables["products"]["Row"];
export type VariantRow = Tables["variants"]["Row"];
export type CategoryRow = Tables["categories"]["Row"];
export type MenuRow = Tables["menus"]["Row"];

export const MENU_ROWS: MenuRow[] = [
  { slug: "marina", name: "Carta Marina", description: "Ceviches y más.", sort_order: 1 },
  { slug: "criolla", name: "Carta Criolla", description: "Fondos.", sort_order: 2 },
  { slug: "vegetariana", name: "Carta Vegetariana", description: "Sin carne.", sort_order: 6 },
];

export const CATEGORY_ROWS: CategoryRow[] = [
  { id: 73, slug: "ceviches", name: "Ceviches", sort_order: 1 },
  { id: 63, slug: "parihuelas", name: "Parihuelas", sort_order: 13 },
  { id: 60, slug: "fondos", name: "Fondos", sort_order: 15 },
  { id: 71, slug: "entradas", name: "Entradas", sort_order: 6 },
];

const BASE_PRODUCT: Omit<ProductRow, "id" | "slug" | "name" | "category_id"> = {
  description: "",
  price_cents: 0,
  variant_label: null,
  image_path: null,
  image_alt: null,
  tags: [],
  allergens: [],
  portion: null,
  choice_groups: [],
  is_available: true,
  is_published: true,
  created_at: "2026-11-15T00:00:00Z",
  updated_at: "2026-11-15T00:00:00Z",
};

export const PARIHUELA_ROW = {
  ...BASE_PRODUCT,
  id: 300,
  slug: "parihuelas",
  name: "Parihuelas",
  description: "Concentrado de pescado, mariscos y pulpa de cangrejo.",
  price_cents: 4200,
  variant_label: "Elige tu pescado",
  category_id: 63,
  image_path: "products/parihuelas.webp",
  image_alt: "Parihuelas",
  variants: [
    {
      id: 302,
      product_id: 300,
      label: "Cabrilla",
      price_cents: 5800,
      is_available: true,
      is_archived: false,
      selections: { "Hecho de": "Cabrilla" },
      sort_order: 1,
    },
    {
      id: 301,
      product_id: 300,
      label: "Pesca del día (filete)",
      price_cents: 4200,
      is_available: true,
      is_archived: false,
      selections: { "Hecho de": "Pesca del día (filete)" },
      sort_order: 0,
    },
  ] satisfies VariantRow[],
  product_menus: [{ menu_slug: "marina" as const }],
};

export const MILANESA_ROW = {
  ...BASE_PRODUCT,
  id: 541,
  slug: "milanesa-de-pollo",
  name: "Milanesa de pollo",
  price_cents: 3500,
  category_id: 60,
  choice_groups: [
    {
      key: "Guarnición 01",
      label: "Elige tu primer acompañamiento",
      options: ["Arroz", "Papas fritas"],
    },
  ],
  variants: [
    {
      id: 542,
      product_id: 541,
      label: "Milanesa de pollo",
      price_cents: 3500,
      is_available: true,
      is_archived: false,
      selections: { "Guarnición 01": null },
      sort_order: 0,
    },
  ] satisfies VariantRow[],
  product_menus: [{ menu_slug: "criolla" as const }],
};

export const CAUSA_VERDURAS_ROW = {
  ...BASE_PRODUCT,
  id: 352,
  slug: "causa-de-verduras",
  name: "Causa de verduras",
  price_cents: 2000,
  category_id: 71,
  tags: ["vegetariano"],
  variants: [] as VariantRow[],
  product_menus: [{ menu_slug: "vegetariana" as const }],
};
