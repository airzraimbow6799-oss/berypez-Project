/**
 * F1-01 · Consultas del catálogo. Cada lectura es una sola consulta con joins de PostgREST
 * (sin N+1); getMenu hace 3 consultas pequeñas en paralelo.
 * Recibe el cliente por parámetro para poder probarlo sin red.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Menu, MenuPage, MenuSlug, Product } from "@/types/catalog";
import type { Database } from "@/types/database";

import { type ProductRowWithRelations, toCategory, toMenu, toProduct } from "./mappers";

export type CatalogClient = SupabaseClient<Database>;

export class CatalogError extends Error {
  constructor(operation: string, cause: string) {
    super(`No se pudo ${operation}: ${cause}`);
    this.name = "CatalogError";
  }
}

const PRODUCT_COLUMNS = "*, variants(*), product_menus(menu_slug)";
// Alias del mismo join filtrado con !inner: filtra por carta sin perder la lista completa de cartas.
const PRODUCT_IN_MENU_COLUMNS = `${PRODUCT_COLUMNS}, en_carta:product_menus!inner(menu_slug)`;

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(result: QueryResult<T>, operation: string): T {
  if (result.error) {
    throw new CatalogError(operation, result.error.message);
  }
  return result.data as T;
}

export function createCatalogRepository(client: CatalogClient, supabaseUrl: string) {
  async function getMenus(): Promise<Menu[]> {
    const result = await client
      .from("menus")
      .select("slug, name, description, sort_order")
      .order("sort_order");
    return unwrap(result, "leer las cartas").map(toMenu);
  }

  async function getMenu(slug: MenuSlug): Promise<MenuPage | null> {
    const [menus, categoriesResult, productsResult] = await Promise.all([
      getMenus(),
      client.from("categories").select("id, slug, name, sort_order").order("sort_order"),
      client
        .from("products")
        .select(PRODUCT_IN_MENU_COLUMNS)
        .eq("en_carta.menu_slug", slug)
        .eq("is_published", true)
        .order("name"),
    ]);

    const menu = menus.find((m) => m.slug === slug);
    if (!menu) {
      return null;
    }

    const categories = unwrap(categoriesResult, "leer las secciones").map(toCategory);
    const rows = unwrap(
      productsResult as QueryResult<ProductRowWithRelations[]>,
      `leer la carta ${slug}`,
    );
    const products = rows.map((row) => toProduct(row, supabaseUrl));

    const sections = categories
      .map((category) => ({
        category,
        products: products.filter((p) => p.categoryId === category.id),
      }))
      .filter((section) => section.products.length > 0);

    return { menu, menus, sections };
  }

  async function getProduct(slug: string): Promise<Product | null> {
    const result = await client
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    const row = unwrap(result as QueryResult<ProductRowWithRelations>, `leer el plato ${slug}`);
    return row ? toProduct(row, supabaseUrl) : null;
  }

  return { getMenus, getMenu, getProduct };
}

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
