import { expect, type Page, test } from "@playwright/test";

import { agregarSudados, esperarHidratacion } from "./ayudas";

// Pagos SIMULADOS del checkout (NEXT_PUBLIC_PAYMENTS_DEMO=1 en el servidor de pruebas): Yape, Plin
// y tarjeta se ven y se sienten como los reales, pero no cobran ni crean pedidos.

async function irAlCheckout(page: Page) {
  await agregarSudados(page);
  await page.goto("/checkout");
  await esperarHidratacion(page, "form input[name=name]");
  await expect(page.getByText("Simulación para la demostración")).toBeVisible();
}

async function llenarContacto(page: Page) {
  await page.getByLabel("Nombre").fill("Rocío Alarcón");
  await page.getByLabel("Celular").fill("987654321");
  await page.getByRole("checkbox").check();
}

test.describe("Checkout · pagos simulados", () => {
  test.beforeEach(async ({ page }) => {
    await irAlCheckout(page);
  });

  test("con tarjeta aprobada se muestra «Pago aprobado» y se aclara que es simulación", async ({
    page,
  }) => {
    await llenarContacto(page);
    await page.getByRole("radio", { name: /Tarjeta/ }).check();
    await page.getByLabel("Número de tarjeta").fill("4111111111111111");
    await expect(page.getByText("Detectamos Visa.")).toBeVisible();
    await page.getByLabel("Nombre en la tarjeta").fill("Rocío Alarcón");
    await page.getByLabel("Vence").fill("1229");
    await page.getByLabel("Código (CVV)").fill("123");
    await page.getByRole("button", { name: /^Pagar/ }).click();

    await expect(page.getByRole("heading", { name: "¡Pago aprobado!" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/no se cobró nada ni se creó un pedido real/)).toBeVisible();
    await expect(page.getByText(/SIM-\d{6}/)).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("la tarjeta de prueba rechazada muestra el motivo y deja corregir", async ({ page }) => {
    await llenarContacto(page);
    await page.getByRole("radio", { name: /Tarjeta/ }).check();
    await page.getByLabel("Número de tarjeta").fill("4000000000000002");
    await page.getByLabel("Nombre en la tarjeta").fill("Rocío Alarcón");
    await page.getByLabel("Vence").fill("1229");
    await page.getByLabel("Código (CVV)").fill("123");
    await page.getByRole("button", { name: /^Pagar/ }).click();

    await expect(page.getByRole("alert").filter({ hasText: /rechazó la tarjeta/ })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: "¡Pago aprobado!" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Pagar/ })).toBeEnabled();
  });

  test("una tarjeta mal escrita marca los campos antes de intentar pagar", async ({ page }) => {
    await llenarContacto(page);
    await page.getByRole("radio", { name: /Tarjeta/ }).check();
    await page.getByLabel("Número de tarjeta").fill("4111");
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: /número no es válido/ })).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: /Revisa los datos del pago/ }),
    ).toBeVisible();
  });

  test("Yape con código válido se aprueba y con 000000 se rechaza", async ({ page }) => {
    await llenarContacto(page);
    await page.getByRole("radio", { name: /Yape/ }).check();
    await page.getByLabel("Celular de Yape").fill("987654321");
    await page.getByLabel("Código de aprobación").fill("000000");
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: /código no es válido/ })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel("Código de aprobación").fill("482913");
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByRole("heading", { name: "¡Pago aprobado!" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Plin espera la aprobación en la app y luego confirma", async ({ page }) => {
    await llenarContacto(page);
    await page.getByRole("radio", { name: /Plin/ }).check();
    await page.getByLabel("Celular afiliado a Plin").fill("987654321");
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByText(/Esperando que apruebes el pago en tu app de Plin/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "¡Pago aprobado!" })).toBeVisible({
      timeout: 12_000,
    });
  });

  test("con efectivo el botón sigue siendo «Confirmar pedido» (el flujo real)", async ({
    page,
  }) => {
    await expect(page.getByRole("radio", { name: /Efectivo/ })).toBeChecked();
    await expect(page.getByRole("button", { name: /Confirmar pedido/ })).toBeVisible();
    await expect(page.getByLabel("¿Con cuánto pagas?")).toBeVisible();
    await page.getByRole("radio", { name: /Tarjeta/ }).check();
    await expect(page.getByLabel("¿Con cuánto pagas?")).toHaveCount(0);
  });

  test("el checkout no se desborda a los lados con la tarjeta abierta", async ({ page }) => {
    await page.getByRole("radio", { name: /Tarjeta/ }).check();
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(0);
  });
});
