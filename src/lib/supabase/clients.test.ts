// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ssr = vi.hoisted(() => ({
  createBrowserClient: vi.fn(() => ({ kind: "browser" })),
  createServerClient: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ssr);

const supabaseJs = vi.hoisted(() => ({ createClient: vi.fn(() => ({ kind: "service" })) }));
vi.mock("@supabase/supabase-js", () => supabaseJs);

const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [{ name: "a", value: "1" }]),
  set: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

const ENV = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  RESEND_API_KEY: "re_test",
  RESEND_FROM_EMAIL: "Berypez <pedidos@example.com>",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

type CookieAdapter = {
  getAll: () => unknown;
  setAll: (cookies: Array<{ name: string; value: string; options?: object }>) => void;
};

function lastCookieAdapter(): CookieAdapter {
  const call = ssr.createServerClient.mock.calls.at(-1) as unknown as [
    string,
    string,
    { cookies: CookieAdapter },
  ];
  return call[2].cookies;
}

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) {
    vi.stubEnv(key, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("cliente del navegador", () => {
  it("usa la URL y la clave publishable", async () => {
    const { createClient } = await import("./client");
    createClient();
    expect(ssr.createBrowserClient).toHaveBeenCalledWith(
      "https://abcd.supabase.co",
      "sb_publishable_test",
    );
  });
});

describe("cliente de servidor", () => {
  it("usa la clave publishable y las cookies de la petición", async () => {
    ssr.createServerClient.mockReturnValue({ kind: "server" });
    const { createClient } = await import("./server");
    await createClient();

    expect(ssr.createServerClient).toHaveBeenCalledWith(
      "https://abcd.supabase.co",
      "sb_publishable_test",
      expect.any(Object),
    );
    const adapter = lastCookieAdapter();
    expect(adapter.getAll()).toEqual([{ name: "a", value: "1" }]);
    adapter.setAll([{ name: "b", value: "2", options: {} }]);
    expect(cookieStore.set).toHaveBeenCalledWith("b", "2", {});
  });

  it("ignora el error al escribir cookies desde un Server Component", async () => {
    ssr.createServerClient.mockReturnValue({ kind: "server" });
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("read-only");
    });
    const { createClient } = await import("./server");
    await createClient();
    expect(() => lastCookieAdapter().setAll([{ name: "b", value: "2" }])).not.toThrow();
  });
});

describe("cliente de servicio", () => {
  it("usa la clave secreta sin persistir sesión", async () => {
    const { createServiceClient } = await import("./service");
    createServiceClient();
    expect(supabaseJs.createClient).toHaveBeenCalledWith(
      "https://abcd.supabase.co",
      "sb_secret_test",
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
  });

  it("falla si falta la clave secreta", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const { createServiceClient } = await import("./service");
    expect(() => createServiceClient()).toThrowError(/SUPABASE_SECRET_KEY/);
  });
});

describe("middleware de sesión", () => {
  it("valida la sesión y copia las cookies renovadas a la respuesta", async () => {
    const getUser = vi.fn(async () => {
      lastCookieAdapter().setAll([{ name: "sb-token", value: "nuevo", options: { path: "/" } }]);
      return { data: { user: null }, error: null };
    });
    ssr.createServerClient.mockReturnValue({ auth: { getUser } });
    const { updateSession } = await import("./middleware");

    const response = await updateSession(new NextRequest("http://localhost/panel"));

    expect(getUser).toHaveBeenCalledOnce();
    expect(lastCookieAdapter().getAll()).toEqual([{ name: "sb-token", value: "nuevo" }]);
    expect(response.cookies.get("sb-token")?.value).toBe("nuevo");
  });
});
