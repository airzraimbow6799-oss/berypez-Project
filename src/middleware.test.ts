// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/middleware", () => ({ updateSession }));

import { middleware } from "./middleware";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined);

beforeEach(() => {
  updateSession.mockReset();
  updateSession.mockImplementation(async () => new Response(null, { status: 200 }));
});

describe("middleware del panel", () => {
  it("una página del panel sin cookies de sesión redirige al ingreso con 307", async () => {
    for (const path of ["/panel", "/panel/reservas", "/panel/carta", "/panel/sin-acceso"]) {
      const response = await middleware(request(path));
      expect(response.status, path).toBe(307);
      expect(response.headers.get("location"), path).toBe("http://localhost/panel/ingresar");
    }
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("el ingreso no se redirige (si no, nadie podría entrar)", async () => {
    const response = await middleware(request("/panel/ingresar"));
    expect(response.status).toBe(200);
    expect(updateSession).toHaveBeenCalledOnce();
  });

  it("con cookie de sesión de Supabase deja pasar y refresca la sesión", async () => {
    const response = await middleware(request("/panel/reservas", "sb-abcd-auth-token=x"));
    expect(response.status).toBe(200);
    expect(updateSession).toHaveBeenCalledOnce();
  });

  it("con cookie de la demostración también deja pasar (la página decide si vale)", async () => {
    const response = await middleware(request("/panel", "berypez_demo_role=admin"));
    expect(response.status).toBe(200);
  });

  it("la API de administración sin cookies llega a su ruta (que responde 401 por sí misma)", async () => {
    const response = await middleware(request("/api/admin/orders/1/status"));
    expect(response.status).toBe(200);
    expect(updateSession).toHaveBeenCalledOnce();
  });

  it("una cookie cualquiera que no es de sesión no cuenta", async () => {
    const response = await middleware(request("/panel/carta", "otra=1; theme=dark"));
    expect(response.status).toBe(307);
  });
});
