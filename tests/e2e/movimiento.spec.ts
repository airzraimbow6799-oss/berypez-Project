import { expect, type Page, test } from "@playwright/test";

// Movimiento «marea» (src/styles/motion.css): entrada de la portada, revelado al hacer scroll,
// elevación de tarjetas y apertura de diálogos. Reglas que se protegen:
//  1. Con «reducir movimiento» no hay animación y todo queda visible (estado final).
//  2. Con movimiento, las animaciones existen y terminan con el contenido visible.
//  3. El movimiento no desplaza el diseño (CLS ~ 0) ni crea scroll horizontal.

const estilo = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { animacion: s.animationName, opacidad: Number(s.opacity), translate: s.translate };
    });

test.describe("Movimiento · con «reducir movimiento»", () => {
  test.use({ reducedMotion: "reduce" });

  test("la portada y los bloques revelables no animan y están visibles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const nodos = await page.locator(".entra, [data-reveal]").evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return { animacion: s.animationName, opacidad: Number(s.opacity) };
      }),
    );
    expect(nodos.length).toBeGreaterThan(8);
    for (const n of nodos) {
      expect(n.animacion).toBe("none");
      expect(n.opacidad).toBe(1);
    }
  });

  test("la vista rápida se abre sin animación", async ({ page }) => {
    await page.goto("/carta/marina");
    await page.getByRole("button", { name: "Sudados", exact: true }).click();
    const vista = page.getByRole("dialog", { name: "Sudados" });
    await expect(vista).toBeVisible();
    expect(await vista.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });
});

test.describe("Movimiento · con animaciones", () => {
  test("la portada entra en orden y termina visible", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();

    expect((await estilo(page, ".entra")).animacion).toBe("marea-sube");
    // Al terminar la entrada (700 ms + escalonado) todo queda en su sitio y opaco.
    await expect
      .poll(async () => (await estilo(page, "h1.entra")).opacidad, { timeout: 4000 })
      .toBe(1);
    await expect
      .poll(async () => (await estilo(page, "h1.entra")).translate)
      .toMatch(/^(0px( 0px)?|none)$/);
  });

  test("las secciones de abajo se revelan al llegar y quedan visibles", async ({ page }) => {
    await page.goto("/");
    const soporta = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
    test.skip(!soporta, "Este navegador no soporta animation-timeline: se ve todo sin animar.");

    const sedes = page.locator("[data-reveal]").last();
    // Aún fuera de pantalla: oculta a la espera de su turno.
    expect(await sedes.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(1);

    await sedes.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect
      .poll(() => sedes.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 4000 })
      .toBe(1);
  });

  test("la vista rápida se abre con animación y termina visible", async ({ page }) => {
    await page.goto("/carta/marina");
    await page.getByRole("button", { name: "Sudados", exact: true }).click();
    const vista = page.getByRole("dialog", { name: "Sudados" });
    await expect(vista).toBeVisible();
    expect(await vista.evaluate((el) => getComputedStyle(el).animationName)).toMatch(
      /dialogo-(sube|asienta|lateral)/,
    );
    await expect
      .poll(() => vista.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 3000 })
      .toBe(1);
  });

  test("la tarjeta de un plato se eleva al pasar el mouse (solo dispositivos con mouse)", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "escritorio", "El toque no tiene hover.");
    await page.goto("/carta/marina");
    const tarjeta = page.locator("article").first();
    await tarjeta.scrollIntoViewIfNeeded();
    await tarjeta.hover();
    await expect
      .poll(() => tarjeta.evaluate((el) => getComputedStyle(el).translate))
      .toBe("0px -4px");
  });

  test("el movimiento no desplaza el diseño (CLS) ni crea scroll horizontal", async ({ page }) => {
    // Se mide DESPUÉS de que la página real reemplazó al loader (ese salto inicial es otro problema:
    // ver carga-inicial.spec.ts, QA-009). Aquí solo interesa lo que añade el movimiento al hacer scroll.
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift" });
    });
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
    }
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(cls, `CLS = ${cls}`).toBeLessThan(0.01);
    expect(desborde).toBeLessThanOrEqual(0);
  });
});
