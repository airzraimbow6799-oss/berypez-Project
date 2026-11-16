import { expect, type Page } from "@playwright/test";

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
