import { expect, type Page, test } from "@playwright/test";

import { esperarHidratacion } from "./ayudas";

// Panel del restaurante en modo demostración (DEMO_PANEL=1 en el servidor de pruebas):
// entrada con una cuenta de ejemplo por rol, menú según el rol y carta administrable.
// Dos roles (22/11): Administración (entra a su Resumen) y Recepción (entra a Reservas).
// No hay rol de cocina: la cocina trabaja con la ticketera de su sistema.
// No usa Supabase ni datos reales.

const menu = (page: Page) => page.getByRole("navigation", { name: "Panel" });

const INICIO = { Administración: /\/panel\/dashboard$/, Recepción: /\/panel\/reservas$/ };

async function entrarComo(page: Page, titulo: keyof typeof INICIO) {
  await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
  const boton = page.getByRole("button", { name: new RegExp(`Entrar como ${titulo}`) });
  await expect(boton).toBeVisible();
  // El formulario debe estar hidratado para que el clic haga la petición.
  await esperarHidratacion(page, "form input[name=email]");
  await boton.click();
  await expect(page).toHaveURL(INICIO[titulo]);
}

test.describe("Panel en modo demostración", () => {
  test("el ingreso ofrece una cuenta de ejemplo por rol, con su correo y contraseña a la vista", async ({
    page,
  }) => {
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Modo demostración" })).toBeVisible();
    for (const titulo of ["Administración", "Recepción"]) {
      await expect(
        page.getByRole("button", { name: new RegExp(`Entrar como ${titulo}`) }),
      ).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /Entrar como Cocina/ })).toHaveCount(0);
    await expect(page.getByText("admin@demo.berypez.pe · demo1234")).toBeVisible();
  });

  test("también se puede escribir el correo y la contraseña de ejemplo a mano", async ({
    page,
  }) => {
    await page.goto("/panel/ingresar", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page, "form input[name=email]");
    await page.getByLabel("Correo").fill("recepcion@demo.berypez.pe");
    await page.getByLabel("Contraseña").fill("demo1234");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel\/reservas$/);
    await expect(page.getByText("Recepción", { exact: true }).first()).toBeVisible();
  });

  test("recepción solo lleva las reservas: Pedidos, Carta y Resumen la mandan a «sin acceso»", async ({
    page,
  }) => {
    await entrarComo(page, "Recepción");
    await expect(page.getByRole("region", { name: "Modo demostración" })).toBeVisible();
    await expect(menu(page).getByRole("link", { name: "Reservas" })).toBeVisible();
    for (const nombre of ["Pedidos", "Carta", "Promociones", "Resumen", "Personal"]) {
      await expect(menu(page).getByRole("link", { name: nombre })).toHaveCount(0);
    }
    for (const ruta of [
      "/panel/pedidos",
      "/panel/carta",
      "/panel/promociones",
      "/panel/dashboard",
    ]) {
      await page.goto(ruta, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/panel\/sin-acceso/);
    }
    await expect(page.getByRole("heading", { name: /No tienes acceso/ })).toBeVisible();
  });

  test("los pedidos de ejemplo avanzan de estado", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Pedidos" }).click();
    await expect(page).toHaveURL(/\/panel\/pedidos$/);
    const tarjeta = page.getByRole("listitem").filter({ hasText: "Lucía Paredes" });
    await expect(tarjeta).toBeVisible();
    await expect(page.getByRole("region", { name: /Recibidos/ })).toContainText("Lucía Paredes");
    await tarjeta.getByRole("button", { name: "Pasar a cocina" }).click();
    await expect(tarjeta.getByText("En cocina")).toBeVisible();
    // El pedido pasa a su apartado por estado.
    await expect(page.getByRole("region", { name: /En cocina/ })).toContainText("Lucía Paredes");
  });

  test("administración cambia un precio, marca un agotado, añade y edita un plato", async ({
    page,
  }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Carta" }).click();
    await expect(page.getByRole("heading", { name: "Carta", level: 1 })).toBeVisible();

    const fila = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Ceviche Berypez" }) });
    const precio = fila.getByLabel("Precio (S/)");
    await expect(precio).toHaveValue("48.00");
    await precio.fill("51.50");
    await precio.press("Enter");
    await expect(precio).toHaveValue("51.50");

    const interruptor = fila.getByRole("switch");
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "false");
    await expect(fila.getByText("Agotado").first()).toBeVisible();

    await page.getByRole("button", { name: /Añadir plato/ }).click();
    const dialogo = page.getByRole("dialog", { name: "Añadir plato" });
    await dialogo.getByLabel("Subir foto").setInputFiles({
      name: "tiradito.png",
      mimeType: "image/png",
      // PNG de 1×1 px.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(dialogo.getByText("Cambiar foto")).toBeVisible();
    await dialogo.getByLabel(/Nombre/).fill("Tiradito nikkei");
    // La sección se elige de la lista con el diseño de la página; «Tiraditos» no existe, se crea.
    await dialogo.getByRole("button", { name: /Sección/ }).click();
    await expect(dialogo.getByRole("option", { name: "Ceviches" })).toBeVisible();
    await dialogo.getByLabel("Crear una sección nueva").fill("Tiraditos");
    await dialogo.getByRole("button", { name: "Crear" }).click();
    await expect(dialogo.getByRole("button", { name: /Sección/ })).toContainText("Tiraditos");
    await dialogo.getByLabel(/Precio/).fill("34.50");
    await dialogo.getByRole("button", { name: "Nuevo" }).click();
    await dialogo.getByRole("button", { name: "Guardar plato" }).click();
    await expect(page.getByRole("heading", { name: "Tiradito nikkei" })).toBeVisible();

    await page.getByRole("button", { name: "Editar Chicharrones" }).click();
    const edicion = page.getByRole("dialog", { name: "Editar «Chicharrones»" });
    await expect(edicion.getByLabel("Título del apartado")).toHaveValue("Elige tu chicharrón");
    await edicion.getByLabel("Precio (S/)").first().fill("38");
    await edicion.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(
      page
        .getByRole("listitem")
        .filter({ has: page.getByRole("heading", { name: "Chicharrones" }) })
        .getByText(/Desde\s*S\/ 38.00/),
    ).toBeVisible();
  });

  test("administración crea una promoción 2×1 y la pausa", async ({ page }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Promociones" }).click();
    await expect(page.getByRole("heading", { name: "Promociones", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: /Nueva promoción/ }).click();
    const dialogo = page.getByRole("dialog", { name: "Nueva promoción" });
    await dialogo.getByLabel("Plato").selectOption({ label: "Jaleas" });
    await dialogo.getByText("2×1", { exact: true }).click();
    await dialogo.getByRole("button", { name: "Guardar promoción" }).click();

    const fila = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Jaleas 2×1" }) });
    await expect(fila).toBeVisible();
    const interruptor = fila.getByRole("switch");
    await expect(interruptor).toHaveAttribute("aria-checked", "true");
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "false");
  });

  test("en demostración avisa que no se publica, muestra la vista previa y la foto del plato", async ({
    page,
  }) => {
    await entrarComo(page, "Administración");
    await menu(page).getByRole("link", { name: "Promociones" }).click();
    await expect(page.getByRole("note")).toContainText("se guardan en este navegador");

    await page.getByRole("button", { name: "Ver ventana emergente" }).click();
    const ventana = page.getByRole("dialog", { name: /Promociones de hoy/ });
    await expect(ventana.getByText("Chicharrones 2×1")).toBeVisible();
    await ventana.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Editar Chicharrones 2×1" }).click();
    const editor = page.getByRole("dialog", { name: /Editar «Chicharrones 2×1»/ });
    await expect(editor.getByText("Foto del plato", { exact: true })).toBeVisible();
    await expect(editor.getByLabel("Empieza (opcional)")).not.toHaveValue("");
  });

  test("«Cambiar de rol» cierra la sesión de ejemplo y vuelve al ingreso", async ({ page }) => {
    await entrarComo(page, "Administración");
    await page.getByRole("button", { name: "Cambiar de rol" }).click();
    await expect(page).toHaveURL(/\/panel\/ingresar/);
    await page.goto("/panel", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panel\/ingresar/);
  });

  test("administración entra directo a su Resumen y ve las seis secciones", async ({ page }) => {
    await entrarComo(page, "Administración");
    await expect(page.getByRole("heading", { name: "Resumen", level: 1 })).toBeVisible();
    for (const nombre of ["Resumen", "Pedidos", "Reservas", "Carta", "Promociones", "Personal"]) {
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
    // Mañana: de noche ya pasaron todas las horas de hoy y la prueba dependía de la hora.
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Lima",
    });
    await dialogo.getByLabel("Día").fill(manana);
    await dialogo
      .getByRole("radiogroup", { name: "Hora" })
      .getByRole("radio", { name: "20:00" })
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
