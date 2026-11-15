import { describe, expect, it } from "vitest";

import {
  CATEGORY_ROWS,
  CAUSA_VERDURAS_ROW,
  MENU_ROWS,
  MILANESA_ROW,
  PARIHUELA_ROW,
} from "./fixtures";
import { CatalogError, type CatalogClient, createCatalogRepository } from "./repository";

type Result = { data: unknown; error: { message: string } | null };

/**
 * Cliente falso: registra la tabla, el select y los filtros, y responde con lo configurado.
 * Imita lo mínimo de la API encadenable de supabase-js.
 */
function fakeClient(responses: Record<string, Result>) {
  const calls: Array<{ table: string; select?: string; filters: Array<[string, unknown]> }> = [];
  const client = {
    from(table: string) {
      const call = {
        table,
        select: undefined as string | undefined,
        filters: [] as Array<[string, unknown]>,
      };
      calls.push(call);
      const builder = {
        select(columns: string) {
          call.select = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push([column, value]);
          return builder;
        },
        in(column: string, value: unknown) {
          call.filters.push([`${column}:in`, value]);
          return builder;
        },
        order() {
          return builder;
        },
        maybeSingle() {
          const r = responses[table] ?? { data: null, error: null };
          const data = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
          return Promise.resolve({ data, error: r.error });
        },
        then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve(responses[table] ?? { data: [], error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as CatalogClient, calls };
}

const STORAGE = "https://abcd.supabase.co";

describe("getMenus", () => {
  it("devuelve las cartas ordenadas", async () => {
    const { client } = fakeClient({ menus: { data: MENU_ROWS, error: null } });
    const menus = await createCatalogRepository(client, STORAGE).getMenus();
    expect(menus.map((m) => m.slug)).toEqual(["marina", "criolla", "vegetariana"]);
    expect(menus[0]).toEqual({
      slug: "marina",
      name: "Carta Marina",
      description: "Ceviches y más.",
      sortOrder: 1,
    });
  });

  it("lanza CatalogError si Supabase responde con error", async () => {
    const { client } = fakeClient({ menus: { data: null, error: { message: "timeout" } } });
    await expect(createCatalogRepository(client, STORAGE).getMenus()).rejects.toBeInstanceOf(
      CatalogError,
    );
  });
});

describe("getMenu", () => {
  it("agrupa los productos de la carta por sección en el orden de las secciones", async () => {
    const { client, calls } = fakeClient({
      menus: { data: MENU_ROWS, error: null },
      categories: { data: CATEGORY_ROWS, error: null },
      products: {
        data: [{ ...MILANESA_ROW, product_menus: [{ menu_slug: "marina" }] }, PARIHUELA_ROW],
        error: null,
      },
    });

    const page = await createCatalogRepository(client, STORAGE).getMenu("marina");

    expect(page?.menu.slug).toBe("marina");
    expect(page?.menus).toHaveLength(3);
    expect(page?.sections.map((s) => [s.category.slug, s.products.map((p) => p.slug)])).toEqual([
      ["parihuelas", ["parihuelas"]],
      ["fondos", ["milanesa-de-pollo"]],
    ]);

    const productsCall = calls.find((c) => c.table === "products");
    expect(productsCall?.filters).toContainEqual(["en_carta.menu_slug", "marina"]);
    expect(productsCall?.filters).toContainEqual(["is_published", true]);
    expect(productsCall?.select).toContain("variants(");
  });

  it("devuelve null si la carta no existe", async () => {
    const { client } = fakeClient({
      menus: { data: MENU_ROWS, error: null },
      categories: { data: CATEGORY_ROWS, error: null },
      products: { data: [], error: null },
    });
    expect(await createCatalogRepository(client, STORAGE).getMenu("el-bar")).toBeNull();
  });

  it("omite secciones vacías", async () => {
    const { client } = fakeClient({
      menus: { data: MENU_ROWS, error: null },
      categories: { data: CATEGORY_ROWS, error: null },
      products: { data: [CAUSA_VERDURAS_ROW], error: null },
    });
    const page = await createCatalogRepository(client, STORAGE).getMenu("vegetariana");
    expect(page?.sections.map((s) => s.category.slug)).toEqual(["entradas"]);
  });
});

describe("getProductsBySlugs", () => {
  it("devuelve los platos en el orden pedido e ignora los que no existen", async () => {
    const { client, calls } = fakeClient({
      products: { data: [MILANESA_ROW, PARIHUELA_ROW], error: null },
    });
    const products = await createCatalogRepository(client, STORAGE).getProductsBySlugs([
      "parihuelas",
      "no-existe",
      "milanesa-de-pollo",
    ]);
    expect(products.map((p) => p.slug)).toEqual(["parihuelas", "milanesa-de-pollo"]);
    expect(calls[0]?.filters).toContainEqual([
      "slug:in",
      ["parihuelas", "no-existe", "milanesa-de-pollo"],
    ]);
  });

  it("no consulta la base con una lista vacía", async () => {
    const { client, calls } = fakeClient({});
    expect(await createCatalogRepository(client, STORAGE).getProductsBySlugs([])).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("getProductsByIds", () => {
  it("devuelve un mapa por id con ids sin repetir", async () => {
    const { client, calls } = fakeClient({ products: { data: [PARIHUELA_ROW], error: null } });
    const map = await createCatalogRepository(client, STORAGE).getProductsByIds([300, 300, 9]);
    expect([...map.keys()]).toEqual([300]);
    expect(calls[0]?.filters).toContainEqual(["id:in", [300, 9]]);
  });

  it("no consulta con una lista vacía", async () => {
    const { client, calls } = fakeClient({});
    expect((await createCatalogRepository(client, STORAGE).getProductsByIds([])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe("getProduct", () => {
  it("devuelve el producto con variantes", async () => {
    const { client, calls } = fakeClient({ products: { data: [PARIHUELA_ROW], error: null } });
    const product = await createCatalogRepository(client, STORAGE).getProduct("parihuelas");
    expect(product?.variants).toHaveLength(2);
    expect(calls[0]?.filters).toContainEqual(["slug", "parihuelas"]);
  });

  it("devuelve null si no existe", async () => {
    const { client } = fakeClient({ products: { data: [], error: null } });
    expect(await createCatalogRepository(client, STORAGE).getProduct("nada")).toBeNull();
  });

  it("lanza CatalogError ante un error de la base", async () => {
    const { client } = fakeClient({ products: { data: null, error: { message: "boom" } } });
    await expect(
      createCatalogRepository(client, STORAGE).getProduct("parihuelas"),
    ).rejects.toThrowError(/boom/);
  });
});
