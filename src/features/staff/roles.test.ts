import { describe, expect, it } from "vitest";

import {
  canAccess,
  homeFor,
  isStaffRole,
  PANEL_SECTIONS,
  roleLabel,
  sectionsFor,
  STAFF_ROLES,
} from "./roles";

describe("roles del personal", () => {
  it("solo hay Administración y Recepción (la cocina usa la ticketera, no el panel)", () => {
    expect(STAFF_ROLES).toEqual(["admin", "salon"]);
    expect(isStaffRole("cocina")).toBe(false);
    expect(isStaffRole("admin")).toBe(true);
  });

  it("admin ve todas las secciones (con las de demostración solo en modo demo)", () => {
    const real = PANEL_SECTIONS.filter((s) => !s.demoOnly).map((s) => s.key);
    expect(sectionsFor("admin").map((s) => s.key)).toEqual(real);
    expect(sectionsFor("admin", true).map((s) => s.key)).toEqual(PANEL_SECTIONS.map((s) => s.key));
  });

  it("administración entra a su Resumen (en el panel real, a Pedidos)", () => {
    expect(homeFor("admin", true)?.key).toBe("dashboard");
    expect(homeFor("admin")?.key).toBe("pedidos");
  });

  it("recepción solo lleva las reservas y entra directo a ellas", () => {
    expect(sectionsFor("salon", true).map((s) => s.key)).toEqual(["reservas"]);
    expect(homeFor("salon", true)?.key).toBe("reservas");
    expect(canAccess("salon", "pedidos", true)).toBe(false);
    expect(canAccess("salon", "carta", true)).toBe(false);
  });

  it("todo rol tiene al menos una sección (si no, quedaría sin dónde entrar)", () => {
    for (const role of STAFF_ROLES) {
      expect(sectionsFor(role).length, role).toBeGreaterThan(0);
      expect(homeFor(role)).toBeDefined();
    }
  });

  it("la sección de inicio de cada rol es una a la que sí puede entrar", () => {
    for (const role of STAFF_ROLES) {
      for (const demo of [false, true]) {
        const home = homeFor(role, demo);
        expect(home && canAccess(role, home.key, demo), `${role} demo=${demo}`).toBe(true);
      }
    }
  });

  it("cada sección tiene una ruta única dentro de /panel (y ninguna es /panel a secas)", () => {
    const hrefs = PANEL_SECTIONS.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href.startsWith("/panel/")).toBe(true);
    }
  });

  it("la carta solo existe en modo demostración y solo para administración", () => {
    expect(canAccess("admin", "carta")).toBe(false);
    expect(canAccess("admin", "carta", true)).toBe(true);
    expect(canAccess("salon", "carta", true)).toBe(false);
  });

  it("el menú real no muestra secciones de demostración", () => {
    for (const role of STAFF_ROLES) {
      expect(sectionsFor(role).some((s) => s.demoOnly)).toBe(false);
    }
  });

  it("cada rol tiene un nombre legible", () => {
    expect(roleLabel("admin")).toBe("Administración");
    expect(roleLabel("salon")).toBe("Recepción");
  });
});
