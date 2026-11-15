/**
 * F1-01 · Filas de Supabase → contrato v1 (`src/types/catalog.ts`).
 * Los campos JSON (`choice_groups`, `selections`) se validan: vienen de la base y
 * cualquiera con acceso al Table Editor puede editarlos.
 */
import { z } from "zod";

import {
  ALLERGENS,
  type Allergen,
  type Category,
  type Menu,
  type MenuSlug,
  type Product,
  PRODUCT_TAGS,
  type ProductTag,
  type Variant,
} from "@/types/catalog";

import type { CategoryRow, MenuRow, ProductRow, VariantRow } from "./fixtures";

export const STORAGE_BUCKET = "catalog";

export type ProductRowWithRelations = ProductRow & {
  variants: VariantRow[];
  product_menus: Array<{ menu_slug: MenuSlug }>;
};

const choiceGroupsSchema = z.array(
  z.object({ key: z.string(), label: z.string(), options: z.array(z.string()) }),
);

const selectionsSchema = z.record(z.string(), z.string().nullable());

export function imageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

function onlyKnown<T extends string>(values: readonly string[], allowed: readonly T[]): T[] {
  return values.filter((value): value is T => (allowed as readonly string[]).includes(value));
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, context: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Datos inválidos en ${context}: ${result.error.issues[0]?.message ?? ""}`);
  }
  return result.data;
}

function toVariant(row: VariantRow, productName: string): Variant {
  return {
    id: row.id,
    label: row.label,
    priceCents: row.price_cents,
    isAvailable: row.is_available,
    selections: parseOrThrow(selectionsSchema, row.selections, `variante de ${productName}`),
  };
}

export function toProduct(row: ProductRowWithRelations, supabaseUrl: string): Product {
  const variants = [...row.variants]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => toVariant(v, row.name));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    variantLabel: row.variant_label,
    categoryId: row.category_id,
    menus: row.product_menus.map((m) => m.menu_slug),
    image: row.image_path
      ? { url: imageUrl(supabaseUrl, row.image_path), alt: row.image_alt ?? row.name }
      : null,
    tags: onlyKnown<ProductTag>(row.tags, PRODUCT_TAGS),
    allergens: onlyKnown<Allergen>(row.allergens, ALLERGENS),
    portion: row.portion,
    isAvailable: row.is_available,
    variants,
    choiceGroups: parseOrThrow(choiceGroupsSchema, row.choice_groups, `${row.name} (elecciones)`),
  };
}

export function toMenu(row: MenuRow): Menu {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export function toCategory(row: CategoryRow): Category {
  return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sort_order };
}
