import { expect, type Page, test } from "@playwright/test";

import { esperarHidratacion } from "./ayudas";

// Panel del restaurante en modo demostración (DEMO_PANEL=1 en el servidor de pruebas):
// entrada con una cuenta de ejemplo por rol, menú según el rol y carta administrable.
// No usa Supabase ni datos reales.

const menu = (page: Page) => page.getByRole("navigation", { name: "Panel" });

async function entrarComo(page: Page, titulo: "Administración" | "Cocina" | "Salón") {
  await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
  const boton = page.getByRole("button", { name: new RegExp(`Entrar como ${titulo}`) });
  await expect(boton).toBeVisible();
  // El formulario debe estar hidratado para que el clic haga la petición.
  await esperarHidratacion(page, "form input[name=email]");
  await boton.click();
  await expect(page).toHaveURL(/\/panel$/);
}

test.describe("Panel en modo demostración", () => {
  test("el ingreso ofrece una cuenta de ejemplo por rol, con su correo y contraseña a la vista", async ({
    page,
  }) => {
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Modo demostración" })).toBeVisible();
    for (const titulo of ["Administración", "Cocina", "Salón"]) {
      await expect(
        page.getByRole("button", { name: new RegExp(`Entrar como ${titulo}`) }),
      ).toBeVisible();
    }
    await expect(page.getByText("admin@demo.berypez.pe · demo1234")).toBeVisible();
  });

  test("también se puede escribir el correo y la contraseña de ejemplo a mano", async ({
    page,
  }) => {
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page, "form input[name=email]");
    await page.getByLabel("Correo").fill("cocina@demo.berypez.pe");
    await page.getByLabel("Contraseña").fill("demo1234");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByText("Cocina", { exact: true }).first()).toBeVisible();
  });

  test("cocina ve solo Pedidos y Carta, y Reservas la manda a «sin acceso»", async ({ page }) => {
    await entrarComo(page, "Cocina");
    await expect(page.getByRole("region", { name: "Modo demostración" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Pedidos" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Carta" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Reservas" })).toHaveCount(0);

    await page.goto("/panel/reservas", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panel\/sin-acceso/);
    await expect(page.getByRole("heading", { name: /No tienes acceso/ })).toBeVisible();
  });

  test("salón ve Pedidos y Reservas, pero no la Carta", async ({ page }) => {
    await entrarComo(page, "Salón");
    await expect(menu(page).getByRole("link", { name: "Reservas" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Carta" })).toHaveCount(0);
    await page.goto("/panel/carta", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panel\/sin-acceso/);
  });

  test("los pedidos de ejemplo avanzan de estado", async ({ page }) => {
    await entrarComo(page, "Administración");
    const tarjeta = page.getByRole("listitem").filter({ hasText: "Lucía Paredes" });
    await expect(tarjeta).toBeVisible();
    await tarjeta.getByRole("button", { name: "Pasar a cocina" }).click();
    await expect(tarjeta.getByText("En cocina")).toBeVisible();
  });

  test("administración cambia un precio, marca un agotado y añade un plato", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Carta" }).click();
    await expect(page.getByRole("heading", { name: "Carta", level: 1 })).toBeVisible();

    const fila = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Ceviche clásico" }) });
    const precio = fila.getByLabel("Precio (S/)");
    await expect(precio).toHaveValue("38.00");
    await precio.fill("41.50");
    await precio.press("Enter");
    await expect(precio).toHaveValue("41.50");

    const interruptor = fila.getByRole("switch");
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "false");
    await expect(fila.getByText("Agotado").first()).toBeVisible();

    await page.getByRole("button", { name: /Añadir plato/ }).click();
    const dialogo = page.getByRole("dialog", { name: "Añadir plato" });
    await dialogo.getByLabel(/Nombre/).fill("Tiradito nikkei");
    await dialogo.getByLabel(/Categoría/).selectOption("Entradas");
    await dialogo.getByLabel(/Precio/).fill("34.50");
    await dialogo.getByRole("button", { name: "Guardar plato" }).click();
    await expect(page.getByRole("heading", { name: "Tiradito nikkei" })).toBeVisible();
  });

  test("«Cambiar de rol» cierra la sesión de ejemplo y vuelve al ingreso", async ({ page }) => {
    await entrarComo(page, "Administración");
    await page.getByRole("button", { name: "Cambiar de rol" }).click();
    await expect(page).toHaveURL(/\/panel\/ingresar/);
    await page.goto("/panel", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panel\/ingresar/);
  });

  test("cocina no ve el Resumen ni el Personal; administración ve las cinco secciones", async ({
    page,
  }) => {
    await entrarComo(page, "Cocina");
    await expect(menu(page).getByRole("link", { name: "Resumen" })).toHaveCount(0);
    await expect(menu(page).getByRole("link", { name: "Personal" })).toHaveCount(0);
    await page.goto("/panel/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panel\/sin-acceso/);

    await page.getByRole("button", { name: "Cambiar de rol" }).click();
    await expect(page).toHaveURL(/\/panel\/ingresar/);
    await entrarComo(page, "Administración");
    for (const nombre of ["Pedidos", "Reservas", "Carta", "Resumen", "Personal"]) {
      await expect(menu(page).getByRole("link", { name: nombre })).toBeVisible();
    }
  });

  test("el resumen muestra las ventas de hoy y una tabla equivalente del gráfico", async ({
    page,
  }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Resumen" }).click();
    await expect(page.getByRole("heading", { name: "Resumen", level: 1 })).toBeVisible();
    await expect(page.getByText("Ventas de hoy")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ventas de los últimos 7 días" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Ventas por día" })).toBeAttached();
  });

  test("una reserva nueva avisa al instante en el panel", async ({ page }) => {
    await entrarComo(page, "Administración");
    await expect(page.getByRole("button", { name: "Simular reserva" })).toBeEnabled();
    await page.getByRole("button", { name: "Simular reserva" }).click();
    await expect(page.getByText(/Reserva nueva/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Avisos, 1 sin leer" })).toBeVisible();
  });

  test("se anota una reserva por llamada y queda en la lista con su origen", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Reservas" }).click();
    await expect(page.getByRole("heading", { name: "Reservas", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: /Nueva reserva/ }).click();
    const dialogo = page.getByRole("dialog", { name: "Nueva reserva" });
    await dialogo
      .getByRole("radiogroup", { name: "Hora" })
      .getByRole("radio", { disabled: false })
      .last()
      .click();
    await dialogo.getByLabel(/Nombre/).fill("Camila Prueba");
    await dialogo.getByLabel(/Celular/).fill("991736402");
    await dialogo.getByRole("button", { name: "Guardar reserva" }).click();
    const tarjeta = page.locator("main li").filter({ hasText: "Camila Prueba" });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText("Llamada")).toBeVisible();
  });

  test("la única persona de administración no se puede desactivar", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Personal" }).click();
    await expect(page.getByRole("heading", { name: "Personal", level: 1 })).toBeVisible();
    const interruptor = page.getByRole("switch", { name: "Marta Rojas: activo" });
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/al menos una persona de administración/)).toBeVisible();
  });

  test("el panel de demostración no desborda a los lados en el celular", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Carta" }).click();
    await expect(page.getByRole("heading", { name: "Carta", level: 1 })).toBeVisible();
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(0);
  });
});
