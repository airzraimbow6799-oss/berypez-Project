import "server-only";

import catalogSnapshot from "../../../../data/catalog/catalog.json";

import { readPublicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Catalog } from "@/types/catalog";

import { type CatalogRepository, createCatalogRepository } from "./repository";
import { createSnapshotCatalogRepository, isSnapshotSource } from "./snapshot";

/** Fuente del catálogo: Supabase por defecto; snapshot si `CATALOG_SOURCE=snapshot`. */
export function createCatalogSource(): CatalogRepository {
  if (isSnapshotSource()) {
    return createSnapshotCatalogRepository(catalogSnapshot as Catalog);
  }
  return createCatalogRepository(createPublicClient(), readPublicEnv().NEXT_PUBLIC_SUPABASE_URL);
}
