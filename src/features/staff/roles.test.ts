import { describe, expect, it } from "vitest";

import { canAccess, homeFor, PANEL_SECTIONS, roleLabel, sectionsFor, STAFF_ROLES } from "./roles";

describe("roles del personal", () => {
  it("admin ve todas las secciones (con las de demostración solo en modo demo)", () => {
    const real = PANEL_SECTIONS.filter((s) => !s.demoOnly).map((s) => s.key);
    expect(sectionsFor("admin").map((s) => s.key)).toEqual(real);
    expect(sectionsFor("admin", true).map((s) => s.key)).toEqual(PANEL_SECTIONS.map((s) => s.key));
  });

  it("cocina ve pedidos pero no reservas", () => {
    expect(canAccess("cocina", "pedidos")).toBe(true);
    expect(canAccess("cocina", "reservas")).toBe(false);
  });

  it("salón ve pedidos y reservas", () => {
    expect(sectionsFor("salon").map((s) => s.key)).toEqual(["pedidos", "reservas"]);
  });

  it("todo rol tiene al menos una sección (si no, quedaría sin dónde entrar)", () => {
    for (const role of STAFF_ROLES) {
      expect(sectionsFor(role).length, role).toBeGreaterThan(0);
      expect(homeFor(role)).toBeDefined();
    }
  });

  it("la sección de inicio de cada rol es una a la que sí puede entrar", () => {
    for (const role of STAFF_ROLES) {
      const home = homeFor(role);
      expect(home && canAccess(role, home.key), role).toBe(true);
    }
  });

  it("cada sección tiene una ruta única dentro de /panel", () => {
    const hrefs = PANEL_SECTIONS.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href.startsWith("/panel")).toBe(true);
  });

  it("la carta solo existe en modo demostración y solo para administración y cocina", () => {
    expect(canAccess("admin", "carta")).toBe(false);
    expect(canAccess("admin", "carta", true)).toBe(true);
    expect(canAccess("cocina", "carta", true)).toBe(true);
    expect(canAccess("salon", "carta", true)).toBe(false);
  });

  it("el menú real no muestra secciones de demostración", () => {
    for (const role of STAFF_ROLES) {
      expect(sectionsFor(role).some((s) => s.demoOnly)).toBe(false);
    }
  });

  it("cada rol tiene un nombre legible", () => {
    expect(roleLabel("admin")).toBe("Administración");
    expect(roleLabel("cocina")).toBe("Cocina");
    expect(roleLabel("salon")).toBe("Salón");
  });
});
