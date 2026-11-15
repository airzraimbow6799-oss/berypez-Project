/**
 * Esquema del snapshot de la Store API de WooCommerce (`data/catalog/raw.json`).
 * Son datos externos: se validan con Zod antes de transformarlos.
 */
import { z } from "zod";

const priceSchema = z.object({
  price: z.string().regex(/^\d+$/, "precio inválido"),
  currency_minor_unit: z.number().int().min(0),
});

const categoryRefSchema = z.object({ id: z.number().int(), slug: z.string(), name: z.string() });

const attributeSchema = z.object({
  name: z.string(),
  terms: z.array(z.object({ name: z.string(), slug: z.string() })),
});

const variationRefSchema = z.object({
  id: z.number().int(),
  attributes: z.array(z.object({ name: z.string(), value: z.string().nullable() })),
});

export const rawProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  description: z.string(),
  short_description: z.string(),
  prices: priceSchema,
  images: z.array(z.object({ src: z.url(), alt: z.string() })),
  categories: z.array(categoryRefSchema),
  attributes: z.array(attributeSchema),
  variations: z.array(variationRefSchema),
  is_in_stock: z.boolean(),
});

export const rawVariationSchema = z.object({
  id: z.number().int(),
  parent: z.number().int(),
  prices: priceSchema,
  is_in_stock: z.boolean(),
});

export const rawCatalogSchema = z.object({
  categories: z.array(categoryRefSchema),
  products: z.array(rawProductSchema),
  variations: z.array(rawVariationSchema),
});

export type RawProduct = z.infer<typeof rawProductSchema>;
export type RawVariation = z.infer<typeof rawVariationSchema>;
export type RawCatalog = z.infer<typeof rawCatalogSchema>;
