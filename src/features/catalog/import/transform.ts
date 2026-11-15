/**
 * F0-04 · Paso 2: snapshot de WooCommerce → catálogo normalizado (contrato v1).
 * Función pura: no lee archivos ni red. Aplica la limpieza del Anexo B.
 */
import type {
  Catalog,
  Category,
  ChoiceGroup,
  MenuSlug,
  Product,
  ProductTag,
  Variant,
} from "@/types/catalog";

import {
  ATTRIBUTE_LABELS,
  ATTRIBUTE_LABELS_BY_CATEGORY,
  CATEGORY_NAME_OVERRIDES,
  CATEGORY_ORDER,
  CATEGORY_TAGS,
  CATEGORY_TO_MENUS,
  DEFAULT_ATTRIBUTE_LABEL,
  FALLBACK_SECTION_CATEGORIES,
  MENUS,
  NON_SECTION_CATEGORIES,
  UNCATEGORIZED_PRODUCT_CATEGORY,
} from "./config";
import { cleanName, cleanText, isDuplicateCopy } from "./text";
import type { RawCatalog, RawProduct, RawVariation } from "./woo-schema";

type RawCategory = RawCatalog["categories"][number];
type RawAttribute = RawProduct["attributes"][number];

const LABEL_SEPARATOR = " · ";

function toCents(price: { price: string; currency_minor_unit: number }): number {
  const value = Number.parseInt(price.price, 10);
  return price.currency_minor_unit === 2
    ? value
    : Math.round(value * 10 ** (2 - price.currency_minor_unit));
}

function productCategorySlugs(product: RawProduct): string[] {
  if (product.categories.length > 0) {
    return product.categories.map((c) => c.slug);
  }
  const assigned = UNCATEGORIZED_PRODUCT_CATEGORY[product.slug];
  return assigned ? [assigned] : [];
}

function pickSectionSlug(slugs: readonly string[]): string | undefined {
  const sections = slugs.filter((slug) => !NON_SECTION_CATEGORIES.has(slug));
  return sections.find((slug) => !FALLBACK_SECTION_CATEGORIES.has(slug)) ?? sections[0];
}

function menusFor(slugs: readonly string[]): MenuSlug[] {
  const found = new Set(slugs.flatMap((slug) => CATEGORY_TO_MENUS[slug] ?? []));
  return MENUS.map((m) => m.slug).filter((slug) => found.has(slug));
}

function tagsFor(slugs: readonly string[]): ProductTag[] {
  return [...new Set(slugs.flatMap((slug) => CATEGORY_TAGS[slug] ?? []))];
}

function attributeLabel(name: string, sectionSlug: string): string {
  return (
    ATTRIBUTE_LABELS_BY_CATEGORY[sectionSlug]?.[name] ??
    ATTRIBUTE_LABELS[name] ??
    DEFAULT_ATTRIBUTE_LABEL
  );
}

/** Traduce el valor guardado en la variación (a veces un slug) al nombre visible. */
function termName(attribute: RawAttribute | undefined, value: string): string {
  const term = attribute?.terms.find((t) => t.slug === value || t.name === value);
  return cleanName(term?.name ?? value);
}

function valuesOf(product: RawProduct, attributeName: string): Array<string | null> {
  return product.variations.map(
    (v) => v.attributes.find((a) => a.name === attributeName)?.value ?? null,
  );
}

/** Un atributo es “de precio” si todas las variaciones fijan su valor. */
function isPriceAttribute(product: RawProduct, attributeName: string): boolean {
  return valuesOf(product, attributeName).every((value) => value !== null);
}

function buildChoiceGroups(product: RawProduct, sectionSlug: string): ChoiceGroup[] {
  return product.attributes
    .filter((attribute) => !isPriceAttribute(product, attribute.name))
    .map((attribute) => ({
      key: attribute.name,
      label: attributeLabel(attribute.name, sectionSlug),
      options: attribute.terms.map((t) => cleanName(t.name)),
    }));
}

function buildVariants(
  product: RawProduct,
  name: string,
  variationsById: ReadonlyMap<number, RawVariation>,
): Variant[] {
  const attributesByName = new Map(product.attributes.map((a) => [a.name, a]));

  const variants = product.variations.map((ref): Variant => {
    const detail = variationsById.get(ref.id);
    if (!detail) {
      throw new Error(`Falta la variante ${ref.id} de “${product.name}” en el snapshot.`);
    }
    const selections = Object.fromEntries(
      ref.attributes.map((a) => [
        a.name,
        a.value === null ? null : termName(attributesByName.get(a.name), a.value),
      ]),
    );
    const fixedValues = Object.values(selections).filter((v): v is string => v !== null);
    return {
      id: ref.id,
      label: fixedValues.length > 0 ? fixedValues.join(LABEL_SEPARATOR) : name,
      priceCents: toCents(detail.prices),
      isAvailable: detail.is_in_stock,
      selections,
    };
  });

  return [...variants].sort(
    (a, b) => a.priceCents - b.priceCents || a.label.localeCompare(b.label, "es"),
  );
}

function variantLabelFor(product: RawProduct, sectionSlug: string): string | null {
  const priceAttributes = product.attributes.filter((a) => isPriceAttribute(product, a.name));
  const first = priceAttributes[0];
  if (product.variations.length < 2 || !first) {
    return null;
  }
  return priceAttributes.length === 1
    ? attributeLabel(first.name, sectionSlug)
    : DEFAULT_ATTRIBUTE_LABEL;
}

function normalizeProduct(
  product: RawProduct,
  categoriesBySlug: ReadonlyMap<string, RawCategory>,
  variationsById: ReadonlyMap<number, RawVariation>,
): Product {
  const name = cleanName(product.name);
  const slugs = productCategorySlugs(product);
  const sectionSlug = pickSectionSlug(slugs);
  const section = sectionSlug ? categoriesBySlug.get(sectionSlug) : undefined;
  if (!sectionSlug || !section) {
    throw new Error(`Producto sin categoría: ${name}`);
  }

  const variants = buildVariants(product, name, variationsById);
  const image = product.images[0];

  return {
    id: product.id,
    slug: product.slug,
    name,
    description: cleanText(product.description || product.short_description),
    priceCents: variants[0]?.priceCents ?? toCents(product.prices),
    variantLabel: variantLabelFor(product, sectionSlug),
    categoryId: section.id,
    menus: menusFor(slugs),
    image: image ? { url: image.src, alt: name } : null,
    tags: tagsFor(slugs),
    allergens: [],
    portion: null,
    isAvailable:
      product.is_in_stock && (variants.length === 0 || variants.some((v) => v.isAvailable)),
    variants,
    choiceGroups: buildChoiceGroups(product, sectionSlug),
  };
}

function categoryRank(slug: string): number {
  const index = CATEGORY_ORDER.indexOf(slug);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function buildCategories(
  products: readonly Product[],
  rawCategories: readonly RawCategory[],
): Category[] {
  const usedIds = new Set(products.map((p) => p.categoryId));
  return rawCategories
    .filter((c) => usedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: CATEGORY_NAME_OVERRIDES[c.slug] ?? cleanName(c.name),
    }))
    .sort(
      (a, b) => categoryRank(a.slug) - categoryRank(b.slug) || a.name.localeCompare(b.name, "es"),
    )
    .map((c, index) => ({ ...c, sortOrder: index + 1 }));
}

export function normalizeCatalog(raw: RawCatalog): Catalog {
  const categoriesBySlug = new Map(raw.categories.map((c) => [c.slug, c]));
  const variationsById = new Map(raw.variations.map((v) => [v.id, v]));

  const products = raw.products
    .filter((p) => !isDuplicateCopy(p.name))
    .map((p) => normalizeProduct(p, categoriesBySlug, variationsById));

  return {
    menus: [...MENUS],
    categories: buildCategories(products, raw.categories),
    products,
  };
}
