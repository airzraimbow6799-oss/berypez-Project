import { expect, type Page, test } from "@playwright/test";

import { agregarSudados } from "./ayudas";

// F2 · Validación del formulario de checkout (CH-01 a CH-12 de docs/qa/fase-2.md).
// Todo ocurre en el navegador, antes de enviar nada: no se crea ningún pedido ni se usa Supabase.

async function irAlCheckout(page: Page) {
  await agregarSudados(page);
  await page.goto("/checkout");
  await expect(page.getByRole("button", { name: /Confirmar pedido/ })).toBeVisible();
}

const confirmar = (page: Page) => page.getByRole("button", { name: /Confirmar pedido/ });
const alerta = (page: Page, texto: string | RegExp) =>
  page.getByRole("alert").filter({ hasText: texto });

test.describe("Checkout · validación", () => {
  test.beforeEach(async ({ page }) => {
    await irAlCheckout(page);
  });

  test("CH-01 · enviar vacío marca los campos obligatorios en español", async ({ page }) => {
    await confirmar(page).click();

    await expect(alerta(page, "Revisa los datos marcados.")).toBeVisible();
    await expect(alerta(page, "Escribe tu nombre.")).toBeVisible();
    await expect(alerta(page, /celular de 9 dígitos/)).toBeVisible();
    await expect(alerta(page, "Acepta los términos para continuar.")).toBeVisible();
    // No se llegó a enviar nada al servidor.
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("CH-05 · recojo no pide distrito ni dirección", async ({ page }) => {
    await page
      .getByRole("radio", { name: /Recojo en/ })
      .first()
      .check();
    await expect(page.getByLabel("Distrito")).toBeHidden();
    await expect(page.getByLabel("Dirección")).toBeHidden();
    await expect(page.getByText("Gratis")).toBeVisible();
  });

  test("CH-06 · delivery sin distrito ni dirección: avisa de cada uno", async ({ page }) => {
    await page.getByRole("radio", { name: /^Delivery/ }).check();
    await expect(page.getByLabel("Distrito")).toBeVisible();
    await expect(page.getByLabel("Dirección")).toBeVisible();

    await confirmar(page).click();
    await expect(alerta(page, "Elige tu distrito.")).toBeVisible();
    await expect(alerta(page, "Escribe la dirección de entrega.")).toBeVisible();
  });

  test("CH-07 · los términos son obligatorios y sus enlaces funcionan", async ({ page }) => {
    await confirmar(page).click();
    await expect(alerta(page, "Acepta los términos para continuar.")).toBeVisible();

    await page.getByRole("checkbox").check();
    await expect(alerta(page, "Acepta los términos para continuar.")).toBeHidden();

    // El pie de página también tiene enlaces legales: se acota al formulario.
    const formulario = page.locator("form");
    await expect(formulario.getByRole("link", { name: "términos y condiciones" })).toHaveAttribute(
      "href",
      "/terminos",
    );
    await expect(formulario.getByRole("link", { name: "política de privacidad" })).toHaveAttribute(
      "href",
      "/privacidad",
    );
  });

  test("CH-08 · «Programar» pide fecha y hora; «Lo antes posible» no", async ({ page }) => {
    await expect(page.getByLabel("Fecha y hora")).toBeHidden();
    await page.getByRole("radio", { name: "Programar" }).check();
    await expect(page.getByLabel("Fecha y hora")).toBeVisible();
  });

  test("CH-12 · el checkout de pruebas ofrece efectivo, Yape, Plin y tarjeta (simulados)", async ({
    page,
  }) => {
    await expect(page.getByText("Simulación para la demostración")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Efectivo/ })).toBeChecked();
    for (const medio of [/Yape/, /Plin/, /Tarjeta/]) {
      await expect(page.getByRole("radio", { name: medio })).toBeEnabled();
    }
  });

  test("CH-09 · un texto con HTML se queda como texto y no se ejecuta", async ({ page }) => {
    let dialogos = 0;
    page.on("dialog", async (d) => {
      dialogos += 1;
      await d.dismiss();
    });

    const html = '<img src=x onerror="alert(1)">';
    await page.getByLabel("Nombre").fill(html);
    await page.getByLabel("Nombre").blur();
    await confirmar(page).click();

    await expect(page.getByLabel("Nombre")).toHaveValue(html);
    expect(dialogos).toBe(0);
  });
});

// QA-005 (corregido): antes, en cuanto la persona escribía en un campo, el aviso de ESE campo ya no
// aparecía (serverErrors[campo] = "" con `??`). Ahora la lógica vive en
// src/features/forms/field-errors.ts y estas pruebas protegen que no vuelva a pasar.
test.describe("Checkout · validación de campos ya escritos (QA-005)", () => {
  test.beforeEach(async ({ page }) => {
    await irAlCheckout(page);
  });

  test("CH-02 · nombre de 1 letra o de más de 80 se rechaza junto al campo", async ({ page }) => {
    const nombre = page.getByLabel("Nombre");

    await nombre.fill("A");
    await nombre.blur();
    await expect(alerta(page, "Escribe tu nombre.")).toBeVisible();

    await nombre.fill("A".repeat(81));
    await nombre.blur();
    await expect(alerta(page, "El nombre es muy largo.")).toBeVisible();
  });

  test("CH-03 · un celular inválido se rechaza junto al campo", async ({ page }) => {
    const celular = page.getByLabel("Celular");
    for (const invalido of ["812345678", "91234567", "9123456789", "abcdefghi"]) {
      await celular.fill(invalido);
      await celular.blur();
      await expect(
        alerta(page, /celular de 9 dígitos/),
        `«${invalido}» debería rechazarse`,
      ).toBeVisible();
    }
  });

  test("CH-04 · un correo inválido avisa junto al campo", async ({ page }) => {
    const correo = page.getByLabel("Correo");
    await correo.fill("a@");
    await correo.blur();
    await expect(alerta(page, "Revisa el correo.")).toBeVisible();
  });

  test("CH-06 · una dirección de menos de 5 caracteres avisa junto al campo", async ({ page }) => {
    await page.getByRole("radio", { name: /^Delivery/ }).check();
    const direccion = page.getByLabel("Dirección");
    await direccion.fill("Av 1");
    await direccion.blur();
    await expect(alerta(page, "Escribe la dirección de entrega.")).toBeVisible();
  });

  test("escribir un celular inválido y confirmar marca el campo, no solo el aviso general", async ({
    page,
  }) => {
    await page.getByLabel("Celular").fill("812345678");
    await confirmar(page).click();
    await expect(alerta(page, /celular de 9 dígitos/)).toBeVisible();
  });
});

test.describe("Checkout · campos válidos", () => {
  test.beforeEach(async ({ page }) => {
    await irAlCheckout(page);
  });

  test("CH-03 · los celulares válidos no muestran error (con +51 y con espacios)", async ({
    page,
  }) => {
    const celular = page.getByLabel("Celular");
    for (const valido of ["912345678", "+51 912 345 678", "912 345 678"]) {
      await celular.fill(valido);
      await celular.blur();
      await expect(
        alerta(page, /celular de 9 dígitos/),
        `«${valido}» debería aceptarse`,
      ).toBeHidden();
    }
  });
});
