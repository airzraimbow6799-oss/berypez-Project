/**
 * Puente entre la carta de la base (productos, variantes, cartas y secciones) y el «plato» que
 * edita el panel. Funciones puras: se prueban sin red.
 */
import { MENU_SLUGS, type MenuSlug, PRODUCT_TAGS, type ProductTag } from "@/types/catalog";

import type { Dish, DishFormOutput } from "./schema";

export const CATALOG_BUCKET = "catalog";

export type DishRow = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  variant_label: string | null;
  image_path: string | null;
  image_alt: string | null;
  tags: string[];
  is_available: boolean;
  choice_groups: unknown;
  categories: { name: string } | null;
  product_menus: Array<{ menu_slug: string }>;
  variants: Array<{
    id: number;
    label: string;
    price_cents: number;
    sort_order: number;
    is_archived: boolean;
  }>;
};

/** Datos que recibe `admin_save_product`. */
export type SaveProductPayload = {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  section: string;
  section_slug: string;
  image_path: string | null;
  image_alt: string | null;
  tags: ProductTag[];
  menus: MenuSlug[];
  is_available: boolean;
  variant_label: string | null;
  choice_groups: Array<{ key: string; label: string; options: string[] }>;
  variants: Array<{ id?: number; label: string; price_cents: number }>;
};

/** «Ceviche de Champiñones (6 unid)» → «ceviche-de-champinones-6-unid». */
export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "plato"
  );
}

export function publicImageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${CATALOG_BUCKET}/${path}`;
}

/** URL pública de una foto del bucket → su ruta dentro del bucket (null si es de otro sitio). */
export function imagePathFromUrl(supabaseUrl: string, url: string): string | null {
  const prefix = publicImageUrl(supabaseUrl, "");
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

type ChoiceGroupJson = { label?: unknown; options?: unknown };

function toChoiceGroups(value: unknown): Dish["choiceGroups"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((group: ChoiceGroupJson) =>
    typeof group?.label === "string" && Array.isArray(group.options)
      ? [{ label: group.label, options: group.options.filter((o) => typeof o === "string") }]
      : [],
  );
}

/** Fila de la base → plato del panel. Con una sola opción, se edita como precio normal. */
export function rowToDish(row: DishRow, supabaseUrl: string): Dish {
  const variants = row.variants
    .filter((v) => !v.is_archived)
    .sort((a, b) => a.sort_order - b.sort_order);
  const hasGroup = variants.length >= 2;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    menus: row.product_menus
      .map((m) => m.menu_slug)
      .filter((m): m is MenuSlug => (MENU_SLUGS as readonly string[]).includes(m)),
    section: row.categories?.name ?? "",
    priceCents: hasGroup
      ? Math.min(...variants.map((v) => v.price_cents))
      : (variants[0]?.price_cents ?? row.price_cents),
    image: row.image_path
      ? { url: publicImageUrl(supabaseUrl, row.image_path), alt: row.image_alt ?? row.name }
      : null,
    tags: row.tags.filter((t): t is ProductTag => (PRODUCT_TAGS as readonly string[]).includes(t)),
    isAvailable: row.is_available,
    priceGroup: hasGroup
      ? {
          label: row.variant_label ?? "Elige una opción",
          options: variants.map((v) => ({ id: v.id, label: v.label, priceCents: v.price_cents })),
        }
      : null,
    choiceGroups: toChoiceGroups(row.choice_groups),
  };
}

/**
 * Reutiliza los ids de las opciones que ya existían, para no perder su historial de pedidos:
 * primero por nombre igual; si se renombró, por la misma posición.
 */
function matchVariantIds(
  next: ReadonlyArray<{ label: string }>,
  previous: Dish["priceGroup"],
): Array<number | undefined> {
  const old = previous?.options ?? [];
  const used = new Set<number>();
  const newLabels = new Set(next.map((o) => o.label.toLowerCase()));
  const byLabel = next.map((option) => {
    const found = old.find(
      (o) => o.id !== undefined && o.label.toLowerCase() === option.label.toLowerCase(),
    );
    if (found?.id !== undefined) used.add(found.id);
    return found?.id;
  });
  return byLabel.map((id, index) => {
    if (id !== undefined) return id;
    const atIndex = old[index];
    if (
      atIndex?.id !== undefined &&
      !used.has(atIndex.id) &&
      !newLabels.has(atIndex.label.toLowerCase())
    ) {
      used.add(atIndex.id);
      return atIndex.id;
    }
    return undefined;
  });
}

/** Plato validado del formulario → datos para `admin_save_product`. */
export function toSavePayload(
  id: number | null,
  data: DishFormOutput,
  previous: Dish | null,
  supabaseUrl: string,
): SaveProductPayload {
  const options = data.priceGroup?.options ?? [];
  const ids = matchVariantIds(options, previous?.priceGroup ?? null);
  return {
    id,
    name: data.name,
    slug: slugify(data.name),
    description: data.description,
    price_cents: data.priceCents,
    section: data.section,
    section_slug: slugify(data.section),
    image_path: data.image ? imagePathFromUrl(supabaseUrl, data.image.url) : null,
    image_alt: data.image?.alt ?? null,
    tags: data.tags,
    menus: data.menus,
    is_available: data.isAvailable,
    variant_label: data.priceGroup?.label ?? null,
    choice_groups: data.choiceGroups.map((g) => ({ key: g.label, ...g })),
    variants: options.map((o, i) => ({
      ...(ids[i] === undefined ? {} : { id: ids[i] }),
      label: o.label,
      price_cents: o.priceCents,
    })),
  };
}
