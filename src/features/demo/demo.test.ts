// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DEMO_ACCOUNTS,
  DEMO_PANEL_BY_DEFAULT,
  demoAccountForCredentials,
  demoAccountForRole,
  isDemoPanel,
} from "./config";
import { createDemoData } from "./seed";

describe("isDemoPanel", () => {
  const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

  it("DEMO_PANEL=1 lo activa en cualquier entorno", () => {
    expect(isDemoPanel(env({ DEMO_PANEL: "1", VERCEL_ENV: "production" }))).toBe(true);
    expect(isDemoPanel(env({ DEMO_PANEL: "1" }))).toBe(true);
  });
  it("DEMO_PANEL=0 lo apaga aunque sea una vista previa", () => {
    expect(isDemoPanel(env({ DEMO_PANEL: "0", VERCEL_ENV: "preview" }))).toBe(false);
  });
  it("sin definir: hoy queda activo porque el sitio principal es la demo", () => {
    expect(DEMO_PANEL_BY_DEFAULT).toBe(true);
    expect(isDemoPanel(env({ VERCEL_ENV: "production" }))).toBe(true);
    expect(isDemoPanel(env({ VERCEL_ENV: "preview" }))).toBe(true);
    expect(isDemoPanel(env({}))).toBe(true);
  });
});

describe("cuentas de demostración", () => {
  it("hay una por rol y los correos son de ejemplo", () => {
    expect(DEMO_ACCOUNTS.map((a) => a.role)).toEqual(["admin", "salon"]);
    for (const account of DEMO_ACCOUNTS)
      expect(account.email.endsWith("@demo.berypez.pe")).toBe(true);
  });
  it("valida correo (sin importar mayúsculas) y contraseña", () => {
    expect(demoAccountForCredentials("ADMIN@demo.berypez.pe", "demo1234")?.role).toBe("admin");
    expect(demoAccountForCredentials("admin@demo.berypez.pe", "otra")).toBeUndefined();
    expect(demoAccountForCredentials("alguien@correo.pe", "demo1234")).toBeUndefined();
  });
  it("solo reconoce roles conocidos", () => {
    expect(demoAccountForRole("salon")?.title).toBe("Recepción");
    // Ya no hay cuenta de cocina: la cocina trabaja con la ticketera de su sistema.
    expect(demoAccountForRole("cocina")).toBeUndefined();
    expect(demoAccountForRole("superadmin")).toBeUndefined();
  });
});

describe("datos de ejemplo", () => {
  const data = createDemoData(Date.parse("2026-11-21T15:00:00Z"));

  it("trae platos, pedidos y reservas", () => {
    expect(data.dishes.length).toBeGreaterThanOrEqual(10);
    expect(data.orders.length).toBeGreaterThan(0);
    expect(data.reservations.length).toBeGreaterThan(0);
  });
  it("los ids no se repiten", () => {
    for (const list of [data.dishes, data.orders, data.reservations]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it("incluye platos agotados y con poco stock para poder enseñarlos", () => {
    expect(data.dishes.some((d) => !d.isAvailable)).toBe(true);
    expect(data.dishes.some((d) => d.stockQty !== null && d.stockQty > 0 && d.stockQty <= 5)).toBe(
      true,
    );
  });
  it("los pedidos recientes quedan antes de ahora y hay uno por estado activo", () => {
    for (const order of data.orders) {
      expect(Date.parse(order.createdAt)).toBeLessThan(Date.parse("2026-11-21T15:00:00Z"));
    }
    const statuses = new Set(data.orders.map((o) => o.status));
    expect(statuses.has("received") && statuses.has("in_kitchen")).toBe(true);
  });
  it("los precios son céntimos enteros positivos", () => {
    for (const d of data.dishes) {
      expect(Number.isInteger(d.priceCents) && d.priceCents > 0).toBe(true);
    }
  });
});
