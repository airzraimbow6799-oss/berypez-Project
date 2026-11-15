import "server-only";

import { cache } from "react";

import { createCatalogSource } from "./source";

/** Repositorio del catálogo para Server Components y Route Handlers (una instancia por petición). */
export const getCatalogRepository = cache(() => createCatalogSource());

export { CatalogError } from "./repository";
