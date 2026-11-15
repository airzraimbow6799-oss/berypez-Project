// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const catalog = vi.hoisted(() => ({
  getMenus: vi.fn(),
  getMenu: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock("@/features/catalog/data/cached", () => ({
  CATALOG_TAG: "catalog",
  getMenusCached: catalog.getMenus,
  getMenuCached: catalog.getMenu,
  getProductCached: catalog.getProduct,
}));

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

import { GET as getMenuRoute } from "./menus/[slug]/route";
import { GET as getMenusRoute } from "./menus/route";
import { GET as getProductRoute } from "./products/[slug]/route";
import { POST as revalidateRoute } from "./revalidate/route";

const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", "s3creto-de-prueba-con-largo-suficiente");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/menus", () => {
  it("devuelve las cartas en el sobre estándar", async () => {
    catalog.getMenus.mockResolvedValue([{ slug: "marina", name: "Carta Marina" }]);
    const res = await getMenusRoute();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      data: [{ slug: "marina", name: "Carta Marina" }],
    });
  });

  it("responde 500 con mensaje en español si falla la base", async () => {
    catalog.getMenus.mockRejectedValue(new Error("timeout interno"));
    const res = await getMenusRoute();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/carta/i);
    expect(JSON.stringify(body)).not.toContain("timeout interno");
  });
});

describe("GET /api/menus/:slug", () => {
  it("devuelve la carta pedida", async () => {
    catalog.getMenu.mockResolvedValue({ menu: { slug: "criolla" }, menus: [], sections: [] });
    const res = await getMenuRoute(
      new NextRequest("http://x/api/menus/criolla"),
      params({ slug: "criolla" }),
    );
    expect(res.status).toBe(200);
    expect(catalog.getMenu).toHaveBeenCalledWith("criolla");
  });

  it("rechaza un slug que no es una carta con 404 sin consultar la base", async () => {
    const res = await getMenuRoute(new NextRequest("http://x"), params({ slug: "../secretos" }));
    expect(res.status).toBe(404);
    expect(catalog.getMenu).not.toHaveBeenCalled();
  });
});

describe("GET /api/products/:slug", () => {
  it("devuelve el plato", async () => {
    catalog.getProduct.mockResolvedValue({ slug: "parihuelas" });
    const res = await getProductRoute(new NextRequest("http://x"), params({ slug: "parihuelas" }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.slug).toBe("parihuelas");
  });

  it("404 si no existe", async () => {
    catalog.getProduct.mockResolvedValue(null);
    const res = await getProductRoute(new NextRequest("http://x"), params({ slug: "no-existe" }));
    expect(res.status).toBe(404);
  });

  it("400 si el slug tiene caracteres inválidos", async () => {
    const res = await getProductRoute(new NextRequest("http://x"), params({ slug: "a b;drop" }));
    expect(res.status).toBe(400);
    expect(catalog.getProduct).not.toHaveBeenCalled();
  });
});

describe("POST /api/revalidate", () => {
  const request = (secret?: string) =>
    new NextRequest("http://x/api/revalidate", {
      method: "POST",
      headers: secret ? { "x-revalidate-secret": secret } : {},
      body: JSON.stringify({ table: "products" }),
    });

  it("revalida la etiqueta del catálogo con el secreto correcto", async () => {
    const res = await revalidateRoute(request("s3creto-de-prueba-con-largo-suficiente"));
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("catalog");
  });

  it("rechaza sin secreto o con secreto incorrecto", async () => {
    expect((await revalidateRoute(request())).status).toBe(401);
    expect((await revalidateRoute(request("otro"))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("responde 503 si el servidor no tiene secreto configurado", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await revalidateRoute(request("cualquiera"))).status).toBe(503);
  });
});
