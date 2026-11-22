// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "./route";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/demo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/demo/login", () => {
  beforeEach(() => vi.stubEnv("DEMO_PANEL", "1"));
  afterEach(() => vi.unstubAllEnvs());

  it("con el modo apagado responde 404 y no guarda nada", async () => {
    vi.stubEnv("DEMO_PANEL", "0");
    const res = await post({ email: "admin@demo.berypez.pe", password: "demo1234" });
    expect(res.status).toBe(404);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("con credenciales de ejemplo guarda el rol en una cookie httpOnly", async () => {
    const res = await post({ email: "recepcion@demo.berypez.pe", password: "demo1234" });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("berypez_demo_role=salon");
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("rechaza contraseña incorrecta, cuerpo vacío y cuentas reales", async () => {
    for (const body of [
      { email: "admin@demo.berypez.pe", password: "mala" },
      { email: "dueña@berypez.pe", password: "demo1234" },
      {},
      null,
    ]) {
      const res = await post(body);
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });
});

describe("DELETE /api/demo/login", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("borra la cookie de la sesión de ejemplo", async () => {
    vi.stubEnv("DEMO_PANEL", "1");
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie") ?? "").toContain("berypez_demo_role=;");
  });

  it("con el modo apagado responde 404", async () => {
    vi.stubEnv("DEMO_PANEL", "0");
    expect((await DELETE()).status).toBe(404);
  });
});
