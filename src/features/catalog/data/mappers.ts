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
  type ProductPromotion,
  PRODUCT_TAGS,
  type ProductTag,
  type Variant,
} from "@/types/catalog";

import { byRelevance, isPromotionLive } from "@/features/promotions/pricing";
import type { Database } from "@/types/database";

import type { CategoryRow, MenuRow, ProductRow, VariantRow } from "./fixtures";

export const STORAGE_BUCKET = "catalog";

export type PromotionRow = Pick<
  Database["public"]["Tables"]["promotions"]["Row"],
  | "id"
  | "kind"
  | "percent_off"
  | "price_cents"
  | "variant_id"
  | "title"
  | "image_path"
  | "starts_at"
  | "ends_at"
  | "is_active"
  | "is_featured"
  | "created_at"
>;

export type ProductRowWithRelations = ProductRow & {
  variants: VariantRow[];
  product_menus: Array<{ menu_slug: MenuSlug }>;
  /** Solo cuando la consulta las pide; con la clave pública RLS ya deja solo las vigentes. */
  promotions?: PromotionRow[];
};

/** La promoción vigente más relevante del plato (también se filtra aquí: el checkout usa la clave secreta). */
export function toPromotion(
  rows: readonly PromotionRow[] | undefined,
  supabaseUrl: string,
  now: number,
): ProductPromotion | null {
  const live = (rows ?? [])
    .map((r) => ({
      row: r,
      isActive: r.is_active,
      isFeatured: r.is_featured,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      createdAt: r.created_at,
    }))
    .filter((p) => isPromotionLive(p, now))
    .sort(byRelevance);
  const best = live[0]?.row;
  if (!best) return null;
  return {
    id: best.id,
    kind: best.kind,
    percentOff: best.percent_off,
    priceCents: best.price_cents,
    variantId: best.variant_id,
    title: best.title,
    imageUrl: best.image_path ? imageUrl(supabaseUrl, best.image_path) : null,
    isFeatured: best.is_featured,
    startsAt: best.starts_at,
    endsAt: best.ends_at,
  };
}

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

export function toProduct(
  row: ProductRowWithRelations,
  supabaseUrl: string,
  now: number = Date.now(),
): Product {
  // Opciones quitadas desde el panel que ya tenían pedidos: siguen en la base pero no se ofrecen.
  const variants = row.variants
    .filter((v) => !v.is_archived)
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
    promotion: toPromotion(row.promotions, supabaseUrl, now),
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
