import { describe, expect, it } from "vitest";

import catalogSnapshot from "../../../../data/catalog/catalog.json";
import type { Catalog } from "@/types/catalog";

import { createSnapshotCatalogRepository, isSnapshotSource } from "./snapshot";

const catalog = catalogSnapshot as Catalog;
const repo = createSnapshotCatalogRepository(catalog);

describe("createSnapshotCatalogRepository", () => {
  it("devuelve las 6 cartas en orden", async () => {
    const menus = await repo.getMenus();
    expect(menus.map((m) => m.slug)).toEqual([
      "marina",
      "criolla",
      "berycafe",
      "piqueos",
      "el-bar",
      "vegetariana",
    ]);
  });

  it("arma la carta por secciones solo con sus platos, ordenados por nombre", async () => {
    const page = await repo.getMenu("marina");
    expect(page?.menu.slug).toBe("marina");
    expect(page?.menus).toHaveLength(6);
    for (const section of page?.sections ?? []) {
      expect(section.products.length).toBeGreaterThan(0);
      expect(section.products.every((p) => p.menus.includes("marina"))).toBe(true);
      expect(section.products.every((p) => p.categoryId === section.category.id)).toBe(true);
      const names = section.products.map((p) => p.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "es")));
    }
  });

  it("devuelve null para una carta inexistente", async () => {
    expect(await repo.getMenu("no-existe" as never)).toBeNull();
  });

  it("busca platos por slug y respeta el orden pedido", async () => {
    const first = catalog.products[0]!;
    const second = catalog.products[1]!;
    expect((await repo.getProduct(first.slug))?.id).toBe(first.id);
    expect(await repo.getProduct("no-existe")).toBeNull();
    const found = await repo.getProductsBySlugs([second.slug, "no-existe", first.slug]);
    expect(found.map((p) => p.id)).toEqual([second.id, first.id]);
  });

  it("busca platos por id para el cotizador", async () => {
    const first = catalog.products[0]!;
    const byId = await repo.getProductsByIds([first.id, first.id, -1]);
    expect([...byId.keys()]).toEqual([first.id]);
  });
});

describe("isSnapshotSource", () => {
  it("solo se activa con CATALOG_SOURCE=snapshot", () => {
    expect(isSnapshotSource("snapshot")).toBe(true);
    expect(isSnapshotSource("")).toBe(false);
    expect(isSnapshotSource("supabase")).toBe(false);
  });
});
