import { expect, test } from "@playwright/test";

// QA-009 (#36) · Al quitar `loading.tsx`, el aviso de carga entre páginas lo da NavigationLoader.
// Se comprueba que sigue funcionando: con la red lenta aparece el velo «Abriendo la página» y,
// cuando la página llega, se retira. Con la red rápida no debe aparecer (sin parpadeo).

test.describe("Aviso de carga entre páginas", () => {
  test("con red lenta aparece «Abriendo la página» y luego se retira", async ({ page }) => {
    // La navegación entre páginas del App Router pide los datos de la ruta (parámetro _rsc).
    await page.route(/[?&]_rsc=/, async (route) => {
      await new Promise((r) => setTimeout(r, 1800));
      await route.continue();
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Se espera a que la página esté interactiva (el clic lo escucha un componente de cliente).
    await page.waitForTimeout(800);

    await page.getByRole("link", { name: "Reservar mesa" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Abriendo la página" })).toBeVisible({
      timeout: 4000,
    });
    await expect(page).toHaveURL(/\/reservas$/, { timeout: 8000 });
    await expect(page.getByRole("status").filter({ hasText: "Abriendo la página" })).toBeHidden({
      timeout: 5000,
    });
  });

  test("con red rápida no hay destello del velo", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(800);

    await page.getByRole("link", { name: "Reservar mesa" }).click();
    await expect(page).toHaveURL(/\/reservas$/);
    await expect(page.getByRole("status").filter({ hasText: "Abriendo la página" })).toHaveCount(0);
  });
});
