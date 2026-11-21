// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** redirect() de Next corta la ejecución lanzando un error; aquí lo imitamos. */
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

const demoCookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "berypez_demo_role" && demoCookie.value ? { value: demoCookie.value } : undefined,
  }),
}));

const db = vi.hoisted(() => ({
  user: null as { id: string; email?: string } | null,
  role: null as { role: string; branch_id: number | null } | null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.role }) }) }),
    }),
  }),
}));

import { getStaffSession, requireStaff } from "./session";

beforeEach(() => {
  db.user = null;
  db.role = null;
  demoCookie.value = undefined;
  vi.unstubAllEnvs();
  vi.stubEnv("DEMO_PANEL", "0");
  redirect.mockClear();
});

describe("getStaffSession", () => {
  it("sin sesión devuelve null", async () => {
    expect(await getStaffSession()).toBeNull();
  });

  it("con sesión pero sin rol en staff_roles devuelve null (un cliente no es personal)", async () => {
    db.user = { id: "u1", email: "cliente@correo.pe" };
    expect(await getStaffSession()).toBeNull();
  });

  it("con rol devuelve correo, rol y sede", async () => {
    db.user = { id: "u1", email: "ana@berypez.pe" };
    db.role = { role: "cocina", branch_id: 2 };
    expect(await getStaffSession()).toEqual({
      email: "ana@berypez.pe",
      role: "cocina",
      branchId: 2,
      isDemo: false,
    });
  });
});

describe("requireStaff", () => {
  it("sin sesión manda al login", async () => {
    await expect(requireStaff("pedidos")).rejects.toThrow("REDIRECT:/panel/ingresar");
  });

  it("con sesión y permiso devuelve la sesión", async () => {
    db.user = { id: "u1", email: "dueña@berypez.pe" };
    db.role = { role: "admin", branch_id: null };
    const session = await requireStaff("reservas");
    expect(session.role).toBe("admin");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("con sesión pero sin permiso manda a «sin acceso»", async () => {
    db.user = { id: "u1", email: "cocina@berypez.pe" };
    db.role = { role: "cocina", branch_id: 1 };
    await expect(requireStaff("reservas")).rejects.toThrow("REDIRECT:/panel/sin-acceso");
  });

  it("sin indicar sección basta con ser personal", async () => {
    db.user = { id: "u1", email: "cocina@berypez.pe" };
    db.role = { role: "cocina", branch_id: 1 };
    await expect(requireStaff()).resolves.toMatchObject({ role: "cocina" });
  });
});

describe("sesión del modo demostración", () => {
  it("con el modo apagado ignora la cookie de demo", async () => {
    demoCookie.value = "admin";
    expect(await getStaffSession()).toBeNull();
  });

  it("con el modo activo y una cookie válida entra con el rol simulado, sin Supabase", async () => {
    vi.stubEnv("DEMO_PANEL", "1");
    demoCookie.value = "cocina";
    expect(await getStaffSession()).toEqual({
      email: "cocina@demo.berypez.pe",
      role: "cocina",
      branchId: null,
      isDemo: true,
    });
  });

  it("una cookie con un rol inventado no sirve", async () => {
    vi.stubEnv("DEMO_PANEL", "1");
    demoCookie.value = "superadmin";
    expect(await getStaffSession()).toBeNull();
  });

  it("las secciones de solo demostración se abren únicamente en modo demo", async () => {
    vi.stubEnv("DEMO_PANEL", "1");
    demoCookie.value = "admin";
    await expect(requireStaff("carta")).resolves.toMatchObject({ isDemo: true });

    vi.stubEnv("DEMO_PANEL", "0");
    demoCookie.value = undefined;
    db.user = { id: "u1", email: "dueña@berypez.pe" };
    db.role = { role: "admin", branch_id: null };
    await expect(requireStaff("carta")).rejects.toThrow("REDIRECT:/panel/sin-acceso");
  });
});
