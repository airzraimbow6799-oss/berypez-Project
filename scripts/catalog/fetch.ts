/**
 * F0-04 · Paso 1: descarga ÚNICA del catálogo público de berypez.pe.
 *
 * - Solo hace peticiones GET a la Store API pública de WooCommerce.
 * - Guarda un snapshot en `data/catalog/raw.json`; los pasos siguientes
 *   (transformar y cargar en Supabase) trabajan sobre ese archivo y nunca
 *   vuelven a llamar a producción.
 *
 * Uso: npm run catalog:fetch            (falla si el snapshot ya existe)
 *      npm run catalog:fetch -- --force (vuelve a descargar)
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Única referencia a producción en todo el repo (ver README, sección 8).
const ORIGIN = "https://berypez.pe";
const API = `${ORIGIN}/wp-json/wc/store/v1`;
const OUT_FILE = path.resolve("data/catalog/raw.json");
const PER_PAGE = 100;
const DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  if (!url.startsWith(API)) {
    throw new Error(`URL fuera de la Store API: ${url}`);
  }
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "catalog-import/0.1" },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} respondió ${res.status}`);
  }
  const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
  await sleep(DELAY_MS);
  return { data: (await res.json()) as T, totalPages };
}

async function getAllPages<T>(endpoint: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const sep = endpoint.includes("?") ? "&" : "?";
    const result = await getJson<T[]>(`${API}${endpoint}${sep}per_page=${PER_PAGE}&page=${page}`);
    items.push(...result.data);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

type RawProductStub = { id: number; variations: { id: number }[] };

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  if (existsSync(OUT_FILE) && !force) {
    throw new Error(
      `Ya existe ${OUT_FILE}. Usa --force solo si de verdad hay que volver a leer producción.`,
    );
  }

  const categories = await getAllPages<unknown>("/products/categories");
  const products = await getAllPages<RawProductStub>("/products");

  const variationIds = products.flatMap((p) => p.variations.map((v) => v.id));
  const variations: unknown[] = [];
  for (const id of variationIds) {
    const { data } = await getJson<unknown>(`${API}/products/${id}`);
    variations.push(data);
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  const snapshot = {
    source: API,
    fetchedAt: new Date().toISOString(),
    categories,
    products,
    variations,
  };
  await writeFile(OUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  process.stdout.write(
    `Snapshot guardado: ${categories.length} categorías, ${products.length} productos, ${variations.length} variantes.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
