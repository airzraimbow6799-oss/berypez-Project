import { expect, test } from "@playwright/test";

// F0-Q2: primera prueba E2E. La portada carga, tiene título y no rompe en consola.
test.describe("Portada", () => {
  test("carga con título y encabezado principal", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (error) => errores.push(error.message));

    const respuesta = await page.goto("/");

    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveTitle(/Berypez/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errores, `Errores de JavaScript en la portada:\n${errores.join("\n")}`).toEqual([]);
  });

  test("no tiene scroll horizontal", async ({ page }) => {
    await page.goto("/");
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(0);
  });
});
