import { expect, test } from "@playwright/test";

/**
 * Promociones en la web: ventana emergente de Inicio (carrusel), precio tachado en la carta,
 * franja «Promociones» y 2×1 en el carrito. Con E2E=1 el catálogo snapshot trae 3 promociones
 * de prueba (src/features/promotions/e2e-fixtures.ts): Ceviche Berypez −20 % (destacada),
 * Chicharrones 2×1 y Lomo saltado a S/ 39.
 */

// Esta prueba SÍ quiere ver la ventana: sin la cookie que la apaga en las demás.
test.use({ storageState: { cookies: [], origins: [] } });

async function aceptarCookies(page: import("@playwright/test").Page) {
  await page.addInitScript(() => window.localStorage.setItem("berypez:cookies", "rejected"));
}

test.describe("Promociones", () => {
  test("al cargar Inicio sale la ventana con la destacada primero y lleva al plato", async ({
    page,
  }) => {
    await aceptarCookies(page);
    await page.goto("/");
    const ventana = page.getByRole("dialog", { name: "Promociones de hoy" });
    await expect(ventana).toBeVisible({ timeout: 15_000 });
    await expect(ventana.getByText("Martes de ceviche")).toBeVisible();
    await expect(ventana.getByText("S/ 38.40")).toBeVisible();

    await ventana.getByRole("button", { name: "Pausar el carrusel" }).click();
    // Orden: destacada, luego la que termina antes (Lomo, con fecha de fin) y luego Chicharrones.
    await ventana.getByRole("button", { name: "Promoción siguiente" }).click();
    await expect(ventana.getByText("Lomo saltado a S/ 39")).toBeVisible();
    await ventana.getByRole("button", { name: "Promoción siguiente" }).click();
    await expect(ventana.getByText("Chicharrones 2×1")).toBeVisible();
    // Mismo formato para toda promoción: antes → ahora y para cuántos platos.
    await expect(ventana.getByText("por 2 platos · pagas solo 1")).toBeVisible();

    await ventana.getByRole("link", { name: "Ver promo" }).click();
    await expect(page).toHaveURL(/\/carta\/marina/);
    await expect(page.getByRole("dialog", { name: "Chicharrones" })).toBeVisible();
    await expect(page).not.toHaveURL(/plato=/);
  });

  test("el carrusel pasa solo a la siguiente promoción", async ({ page }) => {
    await aceptarCookies(page);
    await page.goto("/");
    const ventana = page.getByRole("dialog", { name: "Promociones de hoy" });
    await expect(ventana.getByText("Martes de ceviche")).toBeVisible({ timeout: 15_000 });
    // Con el mouse encima de la ventana también pasa (antes se quedaba detenido).
    await ventana.getByRole("link", { name: "Ver promo" }).hover();
    await expect(ventana.getByText("Lomo saltado a S/ 39")).toBeVisible({ timeout: 9_000 });
  });

  test("no sale si se llega a Inicio desde otra sección ni al cargar otra página", async ({
    page,
  }) => {
    await aceptarCookies(page);
    await page.goto("/carta/marina");
    await expect(page.getByRole("heading", { name: "Promociones" })).toBeVisible();
    await page.getByRole("link", { name: "Berypez, ir al inicio" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.waitForTimeout(3_000);
    await expect(page.getByRole("dialog", { name: /Promoci/ })).toHaveCount(0);
  });

  test("espera la respuesta del aviso de cookies", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2_500);
    await expect(page.getByRole("dialog", { name: /Promoci/ })).toHaveCount(0);
    await page
      .getByRole("button", { name: /Rechazar|Solo necesarias/ })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: "Promociones de hoy" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("la carta muestra el precio tachado, la franja y el 2×1 en el carrito", async ({ page }) => {
    await aceptarCookies(page);
    await page.goto("/carta/marina");

    const franja = page.getByRole("region", { name: "Promociones" });
    await expect(franja.getByRole("button", { name: /^Martes de ceviche/ })).toBeVisible();

    const ceviche = page.locator('[data-producto="ceviche-berypez"]');
    await expect(ceviche.getByText("−20 %")).toBeVisible();
    await expect(ceviche.locator("s")).toHaveText("S/ 48.00");
    await expect(ceviche.getByText("S/ 38.40")).toBeVisible();

    await franja.getByRole("button", { name: /^Chicharrones 2×1/ }).click();
    const vista = page.getByRole("dialog", { name: "Chicharrones" });
    await expect(vista.getByText("Lleva 2 y paga 1")).toBeVisible();
    await vista.getByRole("radio", { name: /Pesca del día/ }).check();
    await vista.getByRole("button", { name: "Agregar un Chicharrones" }).click();
    await expect(vista.getByRole("button", { name: /^Agregar · S\/ 40.00/ })).toBeVisible();
    await vista.getByRole("button", { name: /^Agregar ·/ }).click();

    await page.goto("/carrito");
    await expect(page.getByText("Promoción 2×1: pagas 1 de 2")).toBeVisible();
  });
});
