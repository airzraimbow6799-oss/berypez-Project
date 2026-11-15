import "server-only";

import { unstable_cache } from "next/cache";

import { readPublicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { MenuSlug } from "@/types/catalog";

import { createCatalogRepository } from "./repository";

/** Etiqueta de caché del catálogo: /api/revalidate la invalida al editar en Supabase. */
export const CATALOG_TAG = "catalog";
/** Respaldo si el webhook no llega: 10 minutos (F1-02). */
export const CATALOG_REVALIDATE_SECONDS = 600;

function repository() {
  return createCatalogRepository(createPublicClient(), readPublicEnv().NEXT_PUBLIC_SUPABASE_URL);
}

const options = { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS };

export const getMenusCached = unstable_cache(() => repository().getMenus(), ["menus"], options);

export const getMenuCached = unstable_cache(
  (slug: MenuSlug) => repository().getMenu(slug),
  ["menu"],
  options,
);

export const getProductCached = unstable_cache(
  (slug: string) => repository().getProduct(slug),
  ["product"],
  options,
);
