// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const res = vi.hoisted(() => ({
  getBranchForReservations: vi.fn(),
  getReservedSeats: vi.fn(async () => new Map<string, number>()),
  isBlocked: vi.fn(async () => false),
  createReservation: vi.fn(async () => ({ reservationId: 1, manageToken: "tok" })),
  cancelReservation: vi.fn(),
}));
vi.mock("@/features/reservations/server", () => res);
vi.mock("@/features/checkout/server", () => ({ hitRateLimit: vi.fn(async () => true) }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn(async () => true) }));

const service = vi.hoisted(() => ({ insert: vi.fn(), branchId: 1 as number | null }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) =>
      table === "branches"
        ? {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: service.branchId ? { id: service.branchId } : null,
                }),
              }),
            }),
          }
        : { insert: () => ({ select: () => ({ single: service.insert }) }) },
  }),
}));

const session = vi.hoisted(() => ({
  user: { id: "u" } as { id: string } | null,
  rows: [{ id: 3 }] as unknown[],
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: session.user } }) },
    from: () => ({
      update: () => ({
        eq: () => ({ eq: () => ({ select: async () => ({ data: session.rows, error: null }) }) }),
      }),
    }),
  }),
}));

import { PATCH as adminReservation } from "./admin/reservations/[id]/status/route";
import { POST as complaints } from "./complaints/route";
import { GET as availability } from "./reservations/availability/route";
import { PATCH as manage } from "./reservations/[token]/route";
import { POST as reserve } from "./reservations/route";

const HOURS = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "11:00", close: "17:00" }));
const BRANCH = {
  id: 1,
  slug: "lince",
  name: "Lince",
  whatsapp: null,
  openingHours: HOURS,
  capacity: 40,
};
const TOKEN = "4980ceab-2a0e-4670-83da-2acbe2b52190";
const json = (method: string, body: unknown) =>
  new NextRequest("http://x", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const future = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(
  new Date(Date.now() + 3 * 86_400_000),
);

afterEach(() => {
  vi.clearAllMocks();
  session.user = { id: "u" };
  session.rows = [{ id: 3 }];
});

describe("GET /api/reservations/availability", () => {
  it("devuelve franjas de la sede", async () => {
    res.getBranchForReservations.mockResolvedValue(BRANCH);
    const r = await availability(
      new NextRequest(`http://x/api/reservations/availability?branch=lince&date=${future}&party=2`),
    );
    const body = await r.json();
    expect(body.data.slots[0]).toEqual({ time: "11:00", available: true });
  });

  it("400 con parámetros inválidos y 404 sin sede", async () => {
    expect((await availability(new NextRequest("http://x?branch=x&date=hoy"))).status).toBe(400);
    res.getBranchForReservations.mockResolvedValue(null);
    expect(
      (await availability(new NextRequest(`http://x?branch=lince&date=${future}`))).status,
    ).toBe(404);
  });
});

describe("POST /api/reservations", () => {
  it("crea la reserva", async () => {
    res.getBranchForReservations.mockResolvedValue(BRANCH);
    const r = await reserve(
      json("POST", {
        branchSlug: "lince",
        date: future,
        time: "13:00",
        partySize: 2,
        name: "Rosa",
        phone: "987654321",
        acceptPrivacy: true,
        turnstileToken: "x",
      }),
    );
    expect(r.status).toBe(201);
  });
});

describe("PATCH /api/reservations/:token", () => {
  const params = (token: string) => ({ params: Promise.resolve({ token }) });
  it("cancela, informa si no existe o si ya no se puede", async () => {
    res.cancelReservation
      .mockResolvedValueOnce("ok")
      .mockResolvedValueOnce("not_found")
      .mockResolvedValueOnce("not_cancellable");
    expect((await manage(json("PATCH", { action: "cancel" }), params(TOKEN))).status).toBe(200);
    expect((await manage(json("PATCH", { action: "cancel" }), params(TOKEN))).status).toBe(404);
    expect((await manage(json("PATCH", { action: "cancel" }), params(TOKEN))).status).toBe(409);
  });

  it("400 con token o acción inválidos", async () => {
    expect((await manage(json("PATCH", { action: "cancel" }), params("1"))).status).toBe(400);
    expect((await manage(json("PATCH", { action: "borrar" }), params(TOKEN))).status).toBe(400);
  });
});

describe("POST /api/complaints", () => {
  it("registra y devuelve el número", async () => {
    service.insert.mockResolvedValue({
      data: { number: 9, created_at: "2026-11-16T00:00:00Z" },
      error: null,
    });
    const r = await complaints(
      json("POST", {
        kind: "queja",
        branchSlug: "lince",
        name: "Rosa",
        documentType: "DNI",
        documentNumber: "12345678",
        phone: "987654321",
        email: "r@correo.pe",
        itemType: "servicio",
        description: "Atención muy lenta.",
        request: "Mejorar.",
        turnstileToken: "x",
      }),
    );
    expect((await r.json()).data.number).toBe(9);
  });
});

describe("PATCH /api/admin/reservations/:id/status", () => {
  const params = (id: string) => ({ params: Promise.resolve({ id }) });
  it("marca llegó; 401 sin sesión; 404 si ya fue atendida; 400 inválido", async () => {
    expect((await adminReservation(json("PATCH", { status: "arrived" }), params("3"))).status).toBe(
      200,
    );
    session.rows = [];
    expect((await adminReservation(json("PATCH", { status: "arrived" }), params("3"))).status).toBe(
      404,
    );
    session.user = null;
    expect((await adminReservation(json("PATCH", { status: "arrived" }), params("3"))).status).toBe(
      401,
    );
    expect((await adminReservation(json("PATCH", { status: "volando" }), params("3"))).status).toBe(
      400,
    );
  });
});
