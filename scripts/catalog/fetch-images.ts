/**
 * F0-04 · Fotos: descarga ÚNICA de las fotos del catálogo y conversión a WebP.
 *
 * - Lee las URLs del snapshot `data/catalog/raw.json` (no vuelve a la API).
 * - Solo acepta archivos de `https://berypez.pe/wp-content/uploads/`.
 * - Recorta a 4:3 (1200×900) y comprime a WebP; salida en `public/catalog/<slug>.webp`.
 * - Si el archivo ya existe, no lo vuelve a descargar.
 *
 * Uso: npm run catalog:images
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { isDuplicateCopy } from "../../src/features/catalog/import/text";
import { rawCatalogSchema } from "../../src/features/catalog/import/woo-schema";

const RAW_FILE = path.resolve("data/catalog/raw.json");
const OUT_DIR = path.resolve("public/catalog");
const ALLOWED_PREFIX = "https://berypez.pe/wp-content/uploads/";
const WIDTH = 1200;
const HEIGHT = 900;
const QUALITY = 72;
const DELAY_MS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(url: string): Promise<Buffer> {
  if (!url.startsWith(ALLOWED_PREFIX)) {
    throw new Error(`Origen de imagen no permitido: ${url}`);
  }
  const res = await fetch(url, { method: "GET", headers: { "User-Agent": "catalog-import/0.1" } });
  if (!res.ok) {
    throw new Error(`GET ${url} respondió ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  const raw = rawCatalogSchema.parse(JSON.parse(await readFile(RAW_FILE, "utf8")));
  await mkdir(OUT_DIR, { recursive: true });

  let created = 0;
  let totalBytes = 0;
  for (const product of raw.products.filter((p) => !isDuplicateCopy(p.name))) {
    const image = product.images[0];
    if (!image) {
      continue;
    }
    const outFile = path.join(OUT_DIR, `${product.slug}.webp`);
    if (!existsSync(outFile)) {
      const source = await download(image.src);
      await sharp(source)
        .rotate()
        .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
        .webp({ quality: QUALITY })
        .toFile(outFile);
      created += 1;
      await sleep(DELAY_MS);
    }
    totalBytes += (await stat(outFile)).size;
  }

  process.stdout.write(
    `Fotos nuevas: ${created}. Peso total: ${(totalBytes / 1024 / 1024).toFixed(1)} MB.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
