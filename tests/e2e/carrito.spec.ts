import { expect, test } from "@playwright/test";

import { agregarSudados, botonCarrito } from "./ayudas";

// F2 · Carrito (casos CA-01 a CA-06 de docs/qa/fase-2.md). Sin base de datos: el carrito vive en
// el navegador (localStorage) y los precios del carrito salen del catálogo del snapshot.

const resumen = (page: import("@playwright/test").Page) =>
  page.getByRole("complementary", { name: "Resumen" });

test.describe("Carrito", () => {
  test("CA-02 · vacío: avisa y lleva a la carta", async ({ page }) => {
    await page.goto("/carrito");
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
    await page.getByRole("link", { name: "Ver la carta" }).click();
    await expect(page).toHaveURL(/\/carta\/marina$/);
  });

  test("CA-02 · el checkout vacío no deja continuar y ofrece volver a la carta", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Confirmar pedido/ })).toBeHidden();
  });

  test("CA-01 · agregar un plato sube el contador del encabezado", async ({ page }) => {
    await page.goto("/carta/marina");
    await expect(botonCarrito(page, 0).first()).toBeVisible();

    await agregarSudados(page);
    await expect(botonCarrito(page, 1).first()).toBeVisible();
  });

  test("CA-05 · el carrito se conserva al recargar", async ({ page }) => {
    await agregarSudados(page);
    await page.goto("/carrito");
    await expect(page.getByText("Sudados")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Sudados")).toBeVisible();
    await expect(page.getByText("Tu carrito está vacío.")).toBeHidden();
  });

  test("CA-05 · el carrito se conserva al cerrar y abrir otra pestaña", async ({
    context,
    page,
  }) => {
    await agregarSudados(page);

    const otra = await context.newPage();
    await otra.goto("/carrito");
    await expect(otra.getByText("Sudados")).toBeVisible();
  });

  test("CA-05 · si localStorage falla, la página sigue funcionando", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("localStorage bloqueado");
        },
      });
    });
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/carrito");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/carta/marina");
    await expect(page.getByLabel("Buscar en la carta")).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("CA-06 · mismo plato con otra variante son dos líneas; con la misma variante suma", async ({
    page,
  }) => {
    await agregarSudados(page, "Cabrilla");
    await agregarSudados(page, "Chita", "Pescado entero de 550 GR");
    await agregarSudados(page, "Cabrilla");

    await page.goto("/carrito");
    const lineas = page.getByRole("listitem").filter({ hasText: "Sudados" });
    await expect(lineas).toHaveCount(2);
    await expect(lineas.filter({ hasText: "Chita" })).toContainText("68.00");
    // La línea repetida (Cabrilla) acumula cantidad: 2 × S/ 48.00 = S/ 96.00.
    await expect(lineas.filter({ hasText: "Cabrilla" })).toContainText("96.00");
  });

  test("CA-03 · cambiar cantidad actualiza el total y quitar vacía el carrito", async ({
    page,
  }) => {
    await agregarSudados(page, "Cabrilla");
    await page.goto("/carrito");

    await expect(resumen(page)).toContainText("S/ 48.00");
    await page.getByRole("button", { name: "Agregar un Sudados" }).click();
    await expect(resumen(page)).toContainText("S/ 96.00");
    await page.getByRole("button", { name: "Quitar un Sudados" }).click();
    await expect(resumen(page)).toContainText("S/ 48.00");

    await page.getByRole("button", { name: "Quitar Sudados" }).click();
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
  });

  test("el carrito lleva al checkout con «Continuar»", async ({ page }) => {
    await agregarSudados(page);
    await page.goto("/carrito");
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("button", { name: /Confirmar pedido/ })).toBeVisible();
  });
});
