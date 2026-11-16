import { expect, type Page, test } from "@playwright/test";

import { esperarHidratacion } from "./ayudas";

// Verificación independiente de QA-001 (#23) y regla general: un filtro que se ofrece tiene que
// SEPARAR los platos. Si al tocarlo no cambia nada (o deja la carta vacía), el filtro engaña.
//
// Axel resolvió QA-001 ocultando los filtros que no sirven (`availableFilters`) en lugar de etiquetar
// los platos picantes. Esta prueba no depende de cuál filtro aparezca: revisa que cada chip visible
// sea útil en cada una de las 6 cartas, así sigue valiendo cuando se etiqueten los picantes (F1-04).

const CARTAS = ["marina", "criolla", "berycafe", "piqueos", "el-bar", "vegetariana"];

const tarjetas = (page: Page) => page.locator("[data-producto]");

for (const carta of CARTAS) {
  test(`QA-001 · /carta/${carta}: cada filtro visible separa los platos`, async ({ page }) => {
    await page.goto(`/carta/${carta}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Buscar en la carta")).toBeVisible();
    // La carta es un componente de cliente: se espera a que pinte la primera tarjeta antes de contar.
    await expect(tarjetas(page).first()).toBeVisible();
    await esperarHidratacion(page, "#buscar-carta");

    const total = await tarjetas(page).count();
    expect(total).toBeGreaterThan(0);

    const grupo = page.getByRole("group", { name: "Filtros" });
    const chips = grupo.getByRole("button");
    const cantidad = await chips.count();

    // Sin filtros útiles no debe quedar un grupo vacío en pantalla.
    if (cantidad === 0) {
      await expect(grupo).toBeHidden();
      return;
    }

    for (let i = 0; i < cantidad; i++) {
      const chip = chips.nth(i);
      const nombre = ((await chip.textContent()) ?? "").trim();

      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");
      const filtrados = await tarjetas(page).count();
      expect(filtrados, `«${nombre}» en ${carta} deja la carta vacía`).toBeGreaterThan(0);
      expect(filtrados, `«${nombre}» en ${carta} no cambia nada (filtro inútil)`).toBeLessThan(
        total,
      );

      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "false");
      await expect(tarjetas(page)).toHaveCount(total);
    }
  });
}
