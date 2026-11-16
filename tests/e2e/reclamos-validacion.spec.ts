import { expect, test } from "@playwright/test";

import { esperarHidratacion } from "./ayudas";

// LR-04 · Libro de Reclamaciones: validación de campos YA escritos (el mismo fallo que QA-005 del
// checkout: el error de un campo escrito no se mostraba). Se revisa `aria-invalid`, que el formulario
// pone cuando hay error junto al campo, sin depender del texto exacto del mensaje.
// Todo ocurre en el navegador: no se envía ningún reclamo.

test.describe("Libro de Reclamaciones · campos escritos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/libro-de-reclamaciones", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Nombre completo")).toBeVisible();
    await esperarHidratacion(page, 'input[name="name"]');
  });

  const casos = [
    { campo: "Nombre completo", invalido: "A", valido: "Rafael Pérez Quispe" },
    { campo: "Celular", invalido: "812345678", valido: "912345678" },
    { campo: "Correo", invalido: "a@", valido: "rafael@ejemplo.com" },
  ];

  for (const { campo, invalido, valido } of casos) {
    test(`«${campo}»: un valor inválido se marca junto al campo y uno válido lo limpia`, async ({
      page,
    }) => {
      const input = page.getByLabel(campo, { exact: false }).first();

      await input.fill(invalido);
      await input.blur();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      // El mensaje de error existe y está asociado al campo (lector de pantalla).
      const idError = await input.getAttribute("aria-describedby");
      expect(idError, `«${campo}» sin mensaje asociado`).toBeTruthy();

      await input.fill(valido);
      await input.blur();
      await expect(input).toHaveAttribute("aria-invalid", "false");
    });
  }

  test("enviar vacío marca los obligatorios y no envía nada", async ({ page }) => {
    await page.getByRole("button", { name: /Enviar/ }).click();
    await expect(page.getByLabel("Nombre completo")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/libro-de-reclamaciones$/);
  });
});
