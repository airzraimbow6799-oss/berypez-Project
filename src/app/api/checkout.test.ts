// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const server = vi.hoisted(() => ({
  getBranchesAndZones: vi.fn(),
  getProductsByIds: vi.fn(),
  hitRateLimit: vi.fn(async () => true),
  createOrder: vi.fn(),
  getOrderByToken: vi.fn(),
}));
vi.mock("@/features/checkout/server", () => server);
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn(async () => true) }));

import { GET as getBranches } from "./branches/route";
import { POST as quoteRoute } from "./cart/quote/route";
import { POST as checkoutRoute } from "./checkout/route";
import { GET as getOrder } from "./orders/[token]/route";

const LUNCH = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "00:00", close: "24:00" }));
const BRANCHES = {
  branches: [{ id: 1, slug: "lince", name: "Lince", whatsapp: null, openingHours: LUNCH }],
  zones: [{ district: "Lince", branchId: 1, feeCents: 750, minOrderCents: 0, etaMinutes: 45 }],
};
const PRODUCT = {
  id: 1,
  slug: "ceviche",
  name: "Ceviche",
  description: "",
  priceCents: 4500,
  variantLabel: null,
  categoryId: 1,
  menus: ["marina"],
  image: null,
  tags: [],
  allergens: [],
  portion: null,
  isAvailable: true,
  variants: [],
  choiceGroups: [],
};

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://x", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

afterEach(() => vi.clearAllMocks());

describe("GET /api/branches", () => {
  it("devuelve sedes con estado y zonas sin datos internos", async () => {
    server.getBranchesAndZones.mockResolvedValue(BRANCHES);
    const body = await (await getBranches()).json();
    expect(body.data.branches[0]).toMatchObject({ slug: "lince", status: { isOpen: true } });
    expect(body.data.zones[0]).not.toHaveProperty("branchId");
  });

  it("500 si la base falla", async () => {
    server.getBranchesAndZones.mockRejectedValue(new Error("x"));
    expect((await getBranches()).status).toBe(500);
  });
});

describe("POST /api/cart/quote", () => {
  it("cotiza con la tarifa del distrito", async () => {
    server.getBranchesAndZones.mockResolvedValue(BRANCHES);
    server.getProductsByIds.mockResolvedValue(new Map([[1, PRODUCT]]));
    const res = await quoteRoute(
      json({
        modality: "delivery",
        district: "Lince",
        items: [{ productId: 1, variantId: null, quantity: 2, choices: {}, note: "" }],
      }),
    );
    expect((await res.json()).data).toMatchObject({ totalCents: 9750, etaMinutes: 45 });
  });

  it("400 con un cuerpo que no es JSON", async () => {
    expect((await quoteRoute(json("no-json"))).status).toBe(400);
  });

  it("429 si se supera el límite", async () => {
    server.hitRateLimit.mockResolvedValueOnce(false);
    const res = await quoteRoute(json({ items: [] }));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/checkout", () => {
  it("usa la IP de x-forwarded-for y crea el pedido", async () => {
    server.getBranchesAndZones.mockResolvedValue(BRANCHES);
    server.getProductsByIds.mockResolvedValue(new Map([[1, PRODUCT]]));
    server.createOrder.mockResolvedValue({ orderId: 5, trackingToken: "t" });
    const res = await checkoutRoute(
      json(
        {
          name: "Rosa",
          phone: "987654321",
          modality: "pickup",
          branchSlug: "lince",
          paymentMethod: "cash",
          acceptTerms: true,
          turnstileToken: "x",
          items: [{ productId: 1, variantId: null, quantity: 1, choices: {}, note: "" }],
        },
        { "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
      ),
    );
    expect(res.status).toBe(201);
    expect(server.hitRateLimit).toHaveBeenCalledWith("checkout:ip:9.9.9.9", 10, 600);
  });
});

describe("GET /api/orders/:token", () => {
  const params = (token: string) => ({ params: Promise.resolve({ token }) });

  it("404 con un token que no es UUID, sin consultar", async () => {
    const res = await getOrder(new NextRequest("http://x"), params("1"));
    expect(res.status).toBe(404);
    expect(server.getOrderByToken).not.toHaveBeenCalled();
  });

  it("devuelve el pedido o 404", async () => {
    const token = "d90585f2-0ae3-4f2c-a9c7-1fbeb048f425";
    server.getOrderByToken.mockResolvedValueOnce({ id: 2 }).mockResolvedValueOnce(null);
    expect((await getOrder(new NextRequest("http://x"), params(token))).status).toBe(200);
    expect((await getOrder(new NextRequest("http://x"), params(token))).status).toBe(404);
  });

  it("500 si la base falla", async () => {
    server.getOrderByToken.mockRejectedValueOnce(new Error("x"));
    const res = await getOrder(
      new NextRequest("http://x"),
      params("d90585f2-0ae3-4f2c-a9c7-1fbeb048f425"),
    );
    expect(res.status).toBe(500);
  });
});
