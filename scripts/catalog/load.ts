/**
 * F0-04 · Paso 3: `data/catalog/catalog.json` + `public/catalog/*.webp` → Supabase.
 *
 * - Sube las fotos al bucket público `catalog` (Storage).
 * - Upsert de menus, categories, products, product_menus y variants (idempotente).
 * - Los productos que ya no están en el catálogo se despublican; nunca se borran.
 *
 * Usa la clave secreta (SUPABASE_SECRET_KEY): solo se ejecuta en local o en CI.
 * Uso: npm run catalog:load
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Catalog } from "../../src/types/catalog";
import type { Database } from "../../src/types/database";

const CATALOG_FILE = path.resolve("data/catalog/catalog.json");
const IMAGES_DIR = path.resolve("public/catalog");
const BUCKET = "catalog";
const IMAGE_FOLDER = "products";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env.local.`);
  }
  return value;
}

const supabase = createClient<Database>(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function check<T>(result: { data: T; error: { message: string } | null }, step: string): T {
  if (result.error) {
    throw new Error(`${step}: ${result.error.message}`);
  }
  return result.data;
}

async function ensureBucket(): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) {
    return;
  }
  check(
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "300KB",
      allowedMimeTypes: ["image/webp", "image/avif", "image/jpeg"],
    }),
    "crear bucket",
  );
}

async function uploadImages(catalog: Catalog): Promise<Map<number, string>> {
  const paths = new Map<number, string>();
  const withImage = catalog.products.filter((p) => p.image);
  await Promise.all(
    withImage.map(async (product) => {
      const objectPath = `${IMAGE_FOLDER}/${product.slug}.webp`;
      const file = await readFile(path.join(IMAGES_DIR, `${product.slug}.webp`));
      check(
        await supabase.storage.from(BUCKET).upload(objectPath, file, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        }),
        `subir ${objectPath}`,
      );
      paths.set(product.id, objectPath);
    }),
  );
  return paths;
}

async function main(): Promise<void> {
  const catalog = JSON.parse(await readFile(CATALOG_FILE, "utf8")) as Catalog;

  await ensureBucket();
  const imagePaths = await uploadImages(catalog);

  check(
    await supabase.from("menus").upsert(
      catalog.menus.map((m) => ({
        slug: m.slug,
        name: m.name,
        description: m.description,
        sort_order: m.sortOrder,
      })),
    ),
    "menus",
  );

  check(
    await supabase.from("categories").upsert(
      catalog.categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        sort_order: c.sortOrder,
      })),
    ),
    "categories",
  );

  check(
    await supabase.from("products").upsert(
      catalog.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price_cents: p.priceCents,
        variant_label: p.variantLabel,
        category_id: p.categoryId,
        image_path: imagePaths.get(p.id) ?? null,
        image_alt: p.image?.alt ?? null,
        tags: p.tags,
        allergens: p.allergens,
        portion: p.portion,
        choice_groups: p.choiceGroups.map((g) => ({
          key: g.key,
          label: g.label,
          options: g.options,
        })),
        is_available: p.isAvailable,
        is_published: true,
      })),
    ),
    "products",
  );

  const productIds = catalog.products.map((p) => p.id);
  check(
    await supabase
      .from("products")
      .update({ is_published: false })
      .not("id", "in", `(${productIds.join(",")})`),
    "despublicar productos retirados",
  );

  check(
    await supabase.from("product_menus").delete().in("product_id", productIds),
    "product_menus (limpiar)",
  );
  check(
    await supabase
      .from("product_menus")
      .insert(
        catalog.products.flatMap((p) =>
          p.menus.map((menu) => ({ product_id: p.id, menu_slug: menu })),
        ),
      ),
    "product_menus",
  );

  const variants = catalog.products.flatMap((p) =>
    p.variants.map((v, index) => ({
      id: v.id,
      product_id: p.id,
      label: v.label,
      price_cents: v.priceCents,
      is_available: v.isAvailable,
      selections: v.selections,
      sort_order: index,
    })),
  );
  check(await supabase.from("variants").upsert(variants), "variants");

  process.stdout.write(
    `Cargado: ${catalog.menus.length} cartas, ${catalog.categories.length} secciones, ` +
      `${catalog.products.length} productos, ${variants.length} variantes, ${imagePaths.size} fotos.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
