// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  order: { id: 7, status: "in_kitchen", modality: "pickup" } as Record<string, unknown> | null,
  updateError: null as { message: string } | null,
  updates: [] as unknown[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.order, error: null }) }),
      }),
      update: (values: unknown) => {
        state.updates.push(values);
        return { eq: async () => ({ error: state.updateError }) };
      },
    }),
  }),
}));

import { PATCH } from "./orders/[id]/status/route";

const call = (id: string, body: unknown) =>
  PATCH(new NextRequest("http://x", { method: "PATCH", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id }),
  });

afterEach(() => {
  state.user = { id: "u1" };
  state.order = { id: 7, status: "in_kitchen", modality: "pickup" };
  state.updateError = null;
  state.updates = [];
});

describe("PATCH /api/admin/orders/:id/status", () => {
  it("avanza al siguiente estado válido", async () => {
    const res = await call("7", { status: "ready_for_pickup" });
    expect(res.status).toBe(200);
    expect(state.updates).toEqual([{ status: "ready_for_pickup" }]);
  });

  it("401 sin sesión", async () => {
    state.user = null;
    expect((await call("7", { status: "ready_for_pickup" })).status).toBe(401);
  });

  it("409 si el cambio no es válido para la modalidad", async () => {
    const res = await call("7", { status: "on_the_way" });
    expect(res.status).toBe(409);
    expect(state.updates).toEqual([]);
  });

  it("404 si el pedido no es visible (otra sede, RLS)", async () => {
    state.order = null;
    expect((await call("7", { status: "ready_for_pickup" })).status).toBe(404);
  });

  it("400 con datos inválidos", async () => {
    expect((await call("abc", { status: "ready_for_pickup" })).status).toBe(400);
    expect((await call("7", { status: "volando" })).status).toBe(400);
  });

  it("409 si la base rechaza el cambio (trigger)", async () => {
    state.updateError = { message: "Cambio de estado no permitido" };
    expect((await call("7", { status: "ready_for_pickup" })).status).toBe(409);
  });
});
