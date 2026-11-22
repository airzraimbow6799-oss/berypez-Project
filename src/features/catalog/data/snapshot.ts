/**
 * Repositorio del catálogo sobre el snapshot versionado (`data/catalog/catalog.json`).
 * Misma interfaz que el de Supabase. Se usa SOLO cuando `CATALOG_SOURCE=snapshot`:
 * CI (build sin red ni Supabase) y demos offline. En Vercel la fuente es Supabase.
 */
import { byRelevance } from "@/features/promotions/pricing";
import type { Catalog, Menu, MenuPage, MenuSlug, Product, ProductPromotion } from "@/types/catalog";

import type { CatalogRepository } from "./repository";

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, "es");

/**
 * @param promotions Promociones por slug (solo las pruebas E2E las usan: el snapshot no las trae).
 */
export function createSnapshotCatalogRepository(
  catalog: Catalog,
  promotions: Readonly<Record<string, ProductPromotion>> = {},
): CatalogRepository {
  const menus: Menu[] = [...catalog.menus].sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = [...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const products = catalog.products.map((p) =>
    promotions[p.slug] ? { ...p, promotion: promotions[p.slug] } : p,
  );

  async function getMenus(): Promise<Menu[]> {
    return menus;
  }

  async function getMenu(slug: MenuSlug): Promise<MenuPage | null> {
    const menu = menus.find((m) => m.slug === slug);
    if (!menu) {
      return null;
    }
    const inMenu = products.filter((p) => p.menus.includes(slug)).sort(byName);
    const sections = categories
      .map((category) => ({
        category,
        products: inMenu.filter((p) => p.categoryId === category.id),
      }))
      .filter((section) => section.products.length > 0);
    return { menu, menus, sections };
  }

  async function getProduct(slug: string): Promise<Product | null> {
    return products.find((p) => p.slug === slug) ?? null;
  }

  async function getProductsBySlugs(slugs: readonly string[]): Promise<Product[]> {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  }

  async function getProductsByIds(ids: readonly number[]): Promise<Map<number, Product>> {
    const wanted = new Set(ids);
    return new Map(products.filter((p) => wanted.has(p.id)).map((p) => [p.id, p]));
  }

  async function getPromotedProducts(): Promise<Product[]> {
    return products
      .filter((p) => p.promotion)
      .sort((a, b) =>
        byRelevance({ ...a.promotion!, isActive: true }, { ...b.promotion!, isActive: true }),
      );
  }

  return {
    getMenus,
    getMenu,
    getProduct,
    getProductsBySlugs,
    getProductsByIds,
    getPromotedProducts,
  };
}

/** `CATALOG_SOURCE=snapshot` activa el snapshot; cualquier otro valor usa Supabase. */
export function isSnapshotSource(source: string | undefined = process.env.CATALOG_SOURCE): boolean {
  return source === "snapshot";
}
