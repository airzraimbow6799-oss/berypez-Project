import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyDishForm } from "@/features/carta/schema";

const session = vi.hoisted(() => ({
  value: null as null | { role: string; isDemo: boolean },
}));
const rpc = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => vi.fn());
const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/features/catalog/data/cached", () => ({ CATALOG_TAG: "catalog" }));
vi.mock("@/features/staff/session", () => ({ getStaffSession: async () => session.value }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ storage: { from: () => ({ upload }) } }),
}));
vi.mock("@/lib/env", () => ({
  readPublicEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }),
}));
vi.mock("@/features/carta/server", () => ({
  listDishes: async () => [],
  getDish: async () => null,
}));

const { removeDish, saveDish, setDishAvailable, uploadDishPhoto } = await import("./actions");

const valid = { ...emptyDishForm("marina"), name: "Tacu tacu", section: "Fondos", price: "45" };

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ error: null });
  upload.mockReset().mockResolvedValue({ error: null });
  revalidateTag.mockReset();
});

describe("acciones de la carta real", () => {
  it("las cuentas del modo demostración y Recepción no pueden escribir", async () => {
    for (const value of [{ role: "admin", isDemo: true }, { role: "salon", isDemo: false }, null]) {
      session.value = value;
      expect(await saveDish(null, valid)).toMatchObject({ ok: false });
      expect(await removeDish(1)).toMatchObject({ ok: false });
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("Administración crea un plato y refresca la carta pública", async () => {
    session.value = { role: "admin", isDemo: false };
    expect(await saveDish(null, valid)).toEqual({ ok: true, dishes: [] });
    expect(rpc).toHaveBeenCalledWith(
      "admin_save_product",
      expect.objectContaining({
        p: expect.objectContaining({ id: null, slug: "tacu-tacu", price_cents: 4500 }),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("catalog");
  });

  it("valida en el servidor y devuelve los errores por campo", async () => {
    session.value = { role: "admin", isDemo: false };
    const result = await saveDish(null, { ...valid, name: "", price: "abc" });
    expect(result).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("si la base falla, avisa sin romper", async () => {
    session.value = { role: "admin", isDemo: false };
    rpc.mockResolvedValue({ error: { message: "boom" } });
    expect(await setDishAvailable(1, false)).toMatchObject({ ok: false });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("sube solo fotos WEBP/JPG livianas al bucket de la carta", async () => {
    session.value = { role: "admin", isDemo: false };
    const form = (file: File) => {
      const data = new FormData();
      data.set("photo", file);
      return data;
    };
    expect(
      await uploadDishPhoto(form(new File(["x"], "a.png", { type: "image/png" }))),
    ).toMatchObject({ ok: false });
    expect(
      await uploadDishPhoto(
        form(new File([new Uint8Array(400_000)], "a.webp", { type: "image/webp" })),
      ),
    ).toMatchObject({ ok: false });

    const ok = await uploadDishPhoto(form(new File(["x"], "a.webp", { type: "image/webp" })));
    expect(ok).toMatchObject({
      ok: true,
      url: expect.stringMatching(
        /^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/catalog\/products\/panel\/.+\.webp$/,
      ),
    });
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
