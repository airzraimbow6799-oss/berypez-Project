/**
 * F0-04 · Paso 2: `data/catalog/raw.json` → `data/catalog/catalog.json` (contrato v1).
 * No llama a la red. Uso: npm run catalog:build
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeCatalog } from "../../src/features/catalog/import/transform";
import { rawCatalogSchema } from "../../src/features/catalog/import/woo-schema";

const RAW_FILE = path.resolve("data/catalog/raw.json");
const OUT_FILE = path.resolve("data/catalog/catalog.json");

async function main(): Promise<void> {
  const raw = rawCatalogSchema.parse(JSON.parse(await readFile(RAW_FILE, "utf8")));
  const normalized = normalizeCatalog(raw);
  // La web nunca pide archivos a producción: las fotos se sirven desde
  // `public/catalog` (modo mock) o desde Supabase Storage (ver catalog:load).
  const catalog = {
    ...normalized,
    products: normalized.products.map((p) =>
      p.image ? { ...p, image: { ...p.image, url: `/catalog/${p.slug}.webp` } } : p,
    ),
  };
  await writeFile(OUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  const lines = catalog.menus.map((menu) => {
    const count = catalog.products.filter((p) => p.menus.includes(menu.slug)).length;
    return `  ${menu.name}: ${count} productos`;
  });
  const withoutPhoto = catalog.products.filter((p) => !p.image).map((p) => p.name);
  const withoutMenu = catalog.products.filter((p) => p.menus.length === 0).map((p) => p.name);

  process.stdout.write(
    [
      `Catálogo: ${catalog.products.length} productos, ${catalog.categories.length} secciones.`,
      ...lines,
      `Sin foto: ${withoutPhoto.join(", ") || "ninguno"}`,
      `Sin carta: ${withoutMenu.join(", ") || "ninguno"}`,
      "",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
