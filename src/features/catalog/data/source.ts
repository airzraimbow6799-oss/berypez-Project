import "server-only";

import catalogSnapshot from "../../../../data/catalog/catalog.json";

import { readPublicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Catalog } from "@/types/catalog";

import { E2E_PROMOTIONS } from "@/features/promotions/e2e-fixtures";

import { type CatalogRepository, createCatalogRepository } from "./repository";
import { createSnapshotCatalogRepository, isSnapshotSource } from "./snapshot";

/** Fuente del catálogo: Supabase por defecto; snapshot si `CATALOG_SOURCE=snapshot`. */
export function createCatalogSource(): CatalogRepository {
  if (isSnapshotSource()) {
    // Las pruebas E2E necesitan promociones vigentes; el snapshot real no trae ninguna.
    return createSnapshotCatalogRepository(
      catalogSnapshot as Catalog,
      process.env.E2E === "1" ? E2E_PROMOTIONS : {},
    );
  }
  return createCatalogRepository(createPublicClient(), readPublicEnv().NEXT_PUBLIC_SUPABASE_URL);
}
