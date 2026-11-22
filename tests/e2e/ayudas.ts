import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Agrega «Sudados» al carrito desde la carta Marina, eligiendo variante y tipo.
 * Usa solo la interfaz, como lo haría un cliente. No necesita base de datos.
 */
export async function agregarSudados(
  page: Page,
  pescado: "Pesca del día" | "Cabrilla" | "Tramboyo" | "Chita" = "Cabrilla",
  tipo: "Filete de pescado 200 GR" | "Pescado entero de 550 GR" = "Filete de pescado 200 GR",
) {
  await page.goto("/carta/marina");
  await expect(page.getByLabel("Buscar en la carta")).toBeVisible();
  await page.getByRole("button", { name: "Sudados", exact: true }).click();

  const vista = page.getByRole("dialog", { name: "Sudados" });
  await vista.getByRole("radio", { name: pescado }).check();
  await vista.getByRole("radio", { name: tipo }).check();
  await vista.getByRole("button", { name: /^Agregar ·/ }).click();
  await expect(vista).toBeHidden();
}

/** Cuenta que muestra el botón del carrito del encabezado. */
export function botonCarrito(page: Page, platos: number) {
  return page.getByRole("link", {
    name: platos === 1 ? "Carrito, 1 plato" : `Carrito, ${platos} platos`,
  });
}

/**
 * Espera a que React termine de hidratar un elemento de la página. Escribir o tocar antes de eso
 * se pierde (React vuelve a pintar el valor del servidor) y la prueba queda intermitente.
 */
export async function esperarHidratacion(page: Page, selector: string) {
  await page.waitForFunction((s) => {
    const el = document.querySelector(s);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"));
  }, selector);
}

/**
 * Lleva el botón a la vista y espera a que la página deje de moverse: al desplazarse aparece la
 * barra fija de secciones y el contenido se acomoda; un clic en medio cae en otra parte.
 */
export async function llevarALaVista(page: Page, boton: Locator) {
  // Al centro de la pantalla: en el borde, la tarjeta todavía está entrando (revelado al hacer scroll).
  await boton.evaluate((el) => el.scrollIntoView({ block: "center" }));
  let anterior = "";
  await expect
    .poll(async () => {
      const caja = JSON.stringify(await boton.boundingBox());
      const quieto = caja === anterior;
      anterior = caja;
      return quieto;
    })
    .toBe(true);
}
