import type { Metadata } from "next";

import { SearchView } from "@/components/catalog/SearchView";
import { getMenuCached } from "@/features/catalog/data/cached";
import { MENU_SLUGS, type Product } from "@/types/catalog";

export const revalidate = 600;
export const metadata: Metadata = { title: "Buscar" };

/** F1-03 · Búsqueda en las 6 cartas (tolerante a errores y tildes). */
export default async function SearchPage() {
  const pages = await Promise.all(MENU_SLUGS.map((slug) => getMenuCached(slug)));
  const byId = new Map<number, Product>();
  for (const page of pages) {
    for (const section of page?.sections ?? []) {
      for (const product of section.products) byId.set(product.id, product);
    }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Buscar en la carta</h1>
      <SearchView products={[...byId.values()]} />
    </div>
  );
}
