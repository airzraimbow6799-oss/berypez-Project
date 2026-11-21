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
