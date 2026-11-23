import { beforeEach, describe, expect, it, vi } from "vitest";

import { seedDishes } from "@/features/demo/seed";
import { emptyPromotionForm } from "@/features/promotions/schema";

const session = vi.hoisted(() => ({ value: null as null | { role: string; isDemo: boolean } }));
const calls = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), del: vi.fn(), eq: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/features/catalog/data/cached", () => ({ CATALOG_TAG: "catalog" }));
vi.mock("@/features/staff/session", () => ({ getStaffSession: async () => session.value }));
vi.mock("@/lib/env", () => ({
  readPublicEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }),
}));
vi.mock("@/features/carta/server", () => ({ listDishes: async () => seedDishes() }));
vi.mock("@/features/promotions/server", async (original) => ({
  ...(await original<typeof import("@/features/promotions/server")>()),
  listPromotions: async () => [],
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert: (row: unknown) => (calls.insert(row), Promise.resolve({ error: null })),
      update: (row: unknown) => ({
        eq: (...args: unknown[]) => (calls.update(row, ...args), Promise.resolve({ error: null })),
      }),
      delete: () => ({
        eq: (...args: unknown[]) => (calls.del(...args), Promise.resolve({ error: null })),
      }),
    }),
  }),
}));

const { deletePromotion, savePromotion, setPromotionFlag } = await import("./actions");
const ceviche = seedDishes().find((d) => d.name === "Ceviche Berypez")!;
const valid = { ...emptyPromotionForm(ceviche.id), percent: "20" };

beforeEach(() => {
  for (const fn of Object.values(calls)) fn.mockReset();
});

describe("acciones de promociones", () => {
  it("demo, Recepción y sin sesión no escriben", async () => {
    for (const value of [{ role: "admin", isDemo: true }, { role: "salon", isDemo: false }, null]) {
      session.value = value;
      expect(await savePromotion(null, valid)).toMatchObject({ ok: false });
      expect(await deletePromotion(1)).toMatchObject({ ok: false });
    }
    expect(calls.insert).not.toHaveBeenCalled();
    expect(calls.del).not.toHaveBeenCalled();
  });

  it("Administración crea, pausa y elimina", async () => {
    session.value = { role: "admin", isDemo: false };
    expect(await savePromotion(null, valid)).toEqual({ ok: true, promotions: [] });
    expect(calls.insert).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: ceviche.id, kind: "percent", percent_off: 20 }),
    );
    await setPromotionFlag(3, "isActive", false);
    // Pausar también quita la estrella.
    expect(calls.update).toHaveBeenCalledWith({ is_active: false, is_featured: false }, "id", 3);
    await deletePromotion(3);
    expect(calls.del).toHaveBeenCalledWith("id", 3);
  });

  it("no deja destacar una promoción que no está activa", async () => {
    session.value = { role: "admin", isDemo: false };
    // listPromotions (simulado) no devuelve la promoción 3 como activa.
    expect(await setPromotionFlag(3, "isFeatured", true)).toEqual({
      ok: false,
      message: "Solo se puede destacar una promoción activa.",
    });
    expect(calls.update).not.toHaveBeenCalled();
  });

  it("valida en el servidor contra la carta", async () => {
    session.value = { role: "admin", isDemo: false };
    const result = await savePromotion(null, { ...valid, percent: "200" });
    expect(result).toMatchObject({ ok: false, errors: { percent: expect.any(String) } });
    expect(calls.insert).not.toHaveBeenCalled();
  });
});
