import "server-only";

import { cache } from "react";

import { readPublicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

import { createCatalogRepository } from "./repository";

/** Repositorio del catálogo para Server Components y Route Handlers (una instancia por petición). */
export const getCatalogRepository = cache(() =>
  createCatalogRepository(createPublicClient(), readPublicEnv().NEXT_PUBLIC_SUPABASE_URL),
);

export { CatalogError } from "./repository";
