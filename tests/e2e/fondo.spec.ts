import { expect, test } from "@playwright/test";

// Fondo de mariscos de las páginas públicas (.fondo-mar). Reglas que se protegen:
//  1. Existe, es decorativo (aria-hidden), no intercepta clics y queda detrás de todo.
//  2. Usa el dibujo de public/fondo/mariscos.webp y ese archivo pesa poco (presupuesto: 150 KB).
//  3. Solo está en el sitio público: el panel del restaurante no lo lleva.
//  4. No toca el diseño (sin scroll horizontal) y los botones siguen recibiendo los clics.

const PRESUPUESTO_KB = 150;

test.describe("Fondo de mariscos", () => {
  test("es decorativo, queda detrás de todo y no intercepta clics", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const fondo = page.locator(".fondo-mar");
    await expect(fondo).toHaveCount(1);
    await expect(fondo).toHaveAttribute("aria-hidden", "true");

    const estilo = await fondo.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        posicion: s.position,
        eventos: s.pointerEvents,
        z: s.zIndex,
        opacidad: s.opacity,
        imagen: s.backgroundImage,
      };
    });
    expect(estilo.posicion).toBe("fixed");
    expect(estilo.eventos).toBe("none");
    expect(estilo.z).toBe("-1");
    expect(Number(estilo.opacidad)).toBeGreaterThan(0.05);
    expect(Number(estilo.opacidad)).toBeLessThanOrEqual(0.2);
    expect(estilo.imagen).toContain("/fondo/mariscos.webp");
  });

  test("el dibujo se descarga bien y es liviano", async ({ request }) => {
    const respuesta = await request.get("/fondo/mariscos.webp");
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("image/webp");
    const kb = (await respuesta.body()).length / 1024;
    expect(kb, `El fondo pesa ${kb.toFixed(0)} KB (presupuesto ${PRESUPUESTO_KB} KB)`).toBeLessThan(
      PRESUPUESTO_KB,
    );
  });

  test("los botones siguen recibiendo los clics encima del fondo", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const boton = page.getByRole("link", { name: "Pedir ahora" });
    await expect(boton).toBeVisible();
    const recibe = await boton.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el === arriba || el.contains(arriba);
    });
    expect(recibe).toBe(true);
  });

  for (const ruta of ["/", "/carta/marina", "/checkout", "/reservas"]) {
    test(`${ruta} lleva el fondo y no desborda a los lados`, async ({ page }) => {
      await page.goto(ruta, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".fondo-mar")).toHaveCount(1);
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde).toBeLessThanOrEqual(0);
    });
  }

  test("el panel del restaurante no lleva el fondo", async ({ page }) => {
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".fondo-mar")).toHaveCount(0);
  });
});
