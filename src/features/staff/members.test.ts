import { describe, expect, it } from "vitest";

import { canChange, emailTaken, inviteSchema, type Member } from "./members";

const member = (over: Partial<Member> & { id: number }): Member => ({
  name: "Persona",
  email: `p${over.id}@demo.berypez.pe`,
  role: "cocina",
  branch: "Lince",
  isActive: true,
  isPending: false,
  ...over,
});

describe("canChange", () => {
  const admin = member({ id: 1, role: "admin", branch: null });
  const cook = member({ id: 2 });

  it("no deja quitar el rol ni desactivar a la última administración activa", () => {
    const list = [admin, cook];
    expect(canChange(list, 1, { role: "cocina" }).ok).toBe(false);
    expect(canChange(list, 1, { isActive: false }).ok).toBe(false);
  });

  it("con otra administración activa sí se puede", () => {
    const list = [admin, member({ id: 3, role: "admin", branch: null }), cook];
    expect(canChange(list, 1, { role: "salon" }).ok).toBe(true);
    expect(canChange(list, 1, { isActive: false }).ok).toBe(true);
  });

  it("una administración desactivada no cuenta como respaldo", () => {
    const list = [admin, member({ id: 3, role: "admin", branch: null, isActive: false })];
    expect(canChange(list, 1, { isActive: false }).ok).toBe(false);
  });

  it("cambiar a cocina o salón es libre y subir a administración también", () => {
    expect(canChange([admin, cook], 2, { role: "admin" }).ok).toBe(true);
    expect(canChange([admin, cook], 2, { isActive: false }).ok).toBe(true);
  });

  it("avisa si la persona no existe", () => {
    expect(canChange([admin], 99, { isActive: false })).toMatchObject({ ok: false });
  });
});

describe("inviteSchema", () => {
  const valid = {
    name: "Camila Torres",
    email: "camila@demo.berypez.pe",
    role: "salon",
    branch: "Lince",
  };

  it("acepta una invitación completa", () => {
    expect(inviteSchema.safeParse(valid).success).toBe(true);
  });

  it("administración puede ir sin sede (todas las sedes)", () => {
    expect(inviteSchema.safeParse({ ...valid, role: "admin", branch: "" }).success).toBe(true);
  });

  it("cocina y salón necesitan una sede", () => {
    for (const role of ["cocina", "salon"]) {
      const result = inviteSchema.safeParse({ ...valid, role, branch: "" });
      expect(result.success, role).toBe(false);
    }
  });

  it("rechaza correo inválido, nombre corto y rol desconocido", () => {
    expect(inviteSchema.safeParse({ ...valid, email: "no-es-correo" }).success).toBe(false);
    expect(inviteSchema.safeParse({ ...valid, name: "C" }).success).toBe(false);
    expect(inviteSchema.safeParse({ ...valid, role: "dueño" }).success).toBe(false);
  });
});

describe("emailTaken", () => {
  it("ignora mayúsculas y espacios", () => {
    expect(
      emailTaken([member({ id: 1, email: "ana@demo.berypez.pe" })], " ANA@demo.berypez.pe "),
    ).toBe(true);
    expect(emailTaken([member({ id: 1 })], "otra@demo.berypez.pe")).toBe(false);
  });
});
