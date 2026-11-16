import { expect, type Page, test } from "@playwright/test";

// F1-14 · E2E de la carta: abrir carta → filtrar → buscar «seviche» → vista rápida → elegir variante.
// Corre con el catálogo del snapshot (sin Supabase). La carta Marina tiene 52 platos.

const buscador = (page: Page) => page.getByLabel("Buscar en la carta");
const tarjetas = (page: Page) => page.locator("article");

test.describe("Carta Marina", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/carta/marina");
    // La carta es un componente de cliente: esperar a que hidrate antes de interactuar.
    await expect(buscador(page)).toBeVisible();
    await expect(tarjetas(page).first()).toBeVisible();
  });

  test("muestra los platos en cuadrícula, con foto, precio y botón para agregar", async ({
    page,
  }) => {
    expect(await tarjetas(page).count()).toBeGreaterThan(20);
    const primera = tarjetas(page).first();
    await expect(primera.getByRole("heading", { level: 3 })).toBeVisible();
    await expect(primera).toContainText(/S\/\s?\d+\.\d{2}/);
    await expect(
      primera.getByRole("button", { name: /^(Agregar|Elegir opciones de) / }),
    ).toBeVisible();
  });

  test("buscar «seviche» devuelve ceviches (tolera errores de escritura)", async ({ page }) => {
    await buscador(page).fill("seviche");

    await expect(page.getByText(/\d+ platos? encontrados?|1 plato encontrado/)).toBeVisible();
    await expect(page.getByText("No encontramos platos con esa búsqueda.")).toBeHidden();

    const nombres = await tarjetas(page).getByRole("heading", { level: 3 }).allTextContents();
    expect(nombres.length).toBeGreaterThan(0);
    expect(nombres.some((n) => /ceviche/i.test(n))).toBe(true);
  });

  test("buscar en mayúsculas o minúsculas da el mismo resultado", async ({ page }) => {
    await buscador(page).fill("CEVICHE");
    const conMayusculas = await tarjetas(page).count();
    await buscador(page).fill("ceviche");
    await expect(tarjetas(page)).toHaveCount(conMayusculas);
  });

  test("una búsqueda sin resultados avisa y «Quitar filtros» devuelve la carta", async ({
    page,
  }) => {
    const total = await tarjetas(page).count();

    await buscador(page).fill("zzzzqqqq");
    await expect(page.getByText("No encontramos platos con esa búsqueda.")).toBeVisible();
    await expect(tarjetas(page)).toHaveCount(0);

    await page.getByRole("button", { name: "Quitar filtros" }).click();
    await expect(tarjetas(page)).toHaveCount(total);
    await expect(buscador(page)).toHaveValue("");
  });

  test("el filtro «Hasta S/ 40» reduce los platos y se puede quitar", async ({ page }) => {
    const total = await tarjetas(page).count();
    const filtro = page.getByRole("button", { name: "Hasta S/ 40" });

    await filtro.click();
    await expect(filtro).toHaveAttribute("aria-pressed", "true");
    const filtrados = await tarjetas(page).count();
    expect(filtrados).toBeGreaterThan(0);
    expect(filtrados).toBeLessThan(total);
    await expect(page.getByText(`${filtrados} platos encontrados`)).toBeVisible();

    await filtro.click();
    await expect(filtro).toHaveAttribute("aria-pressed", "false");
    await expect(tarjetas(page)).toHaveCount(total);
  });

  test("QA-001 · solo se ofrecen filtros que cambian algo en esta carta", async ({ page }) => {
    // Corregido: un filtro aparece solo si separa platos. Hoy ningún plato está etiquetado como
    // picante (F1-04, lo confirma la dueña) ni para niños en Marina, así que esos no se ofrecen.
    // Cuando se etiqueten los picantes, «Sin picante» aparecerá solo: entonces esta prueba debe
    // pasar a comprobar que al tocarlo desaparecen los platos picantes.
    const filtros = page.getByRole("group", { name: "Filtros" });
    await expect(filtros.getByRole("button", { name: "Sin picante" })).toHaveCount(0);
    await expect(filtros.getByRole("button", { name: "Para niños" })).toHaveCount(0);

    for (const nombre of ["Vegetariano", "Para compartir", "Hasta S/ 40"]) {
      await expect(filtros.getByRole("button", { name: nombre })).toBeVisible();
    }
  });

  test("vista rápida: elegir variante cambia el precio y habilita «Agregar»", async ({ page }) => {
    await page.getByRole("button", { name: "Sudados", exact: true }).click();

    const vista = page.getByRole("dialog", { name: "Sudados" });
    await expect(vista).toBeVisible();
    await expect(vista.getByText("Elige tu pescado")).toBeVisible();

    // Falta elegir el tipo: no se puede agregar todavía y se explica por qué.
    const agregar = vista.getByRole("button", { name: /^Agregar ·/ });
    await expect(agregar).toBeDisabled();
    await expect(vista.getByText(/^Falta:/)).toBeVisible();

    await vista.getByRole("radio", { name: "Cabrilla" }).check();
    await vista.getByRole("radio", { name: "Filete de pescado 200 GR" }).check();

    await expect(agregar).toBeEnabled();
    await expect(agregar).toContainText("S/ 48.00");

    // La cantidad multiplica el precio.
    await vista.getByRole("button", { name: "Agregar un Sudados" }).click();
    await expect(agregar).toContainText("S/ 96.00");
  });

  test("vista rápida: agregar al carrito avisa y cierra la ventana", async ({ page }) => {
    await page.getByRole("button", { name: "Sudados", exact: true }).click();
    const vista = page.getByRole("dialog", { name: "Sudados" });
    await vista.getByRole("radio", { name: "Chita" }).check();
    await vista.getByRole("radio", { name: "Pescado entero de 550 GR" }).check();
    await vista.getByRole("button", { name: /^Agregar ·/ }).click();

    await expect(page.getByText(/Agregaste 1 × Sudados/)).toBeVisible();
    await expect(vista).toBeHidden();
  });

  test("vista rápida: se cierra con la tecla Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Sudados", exact: true }).click();
    const vista = page.getByRole("dialog", { name: "Sudados" });
    await expect(vista).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(vista).toBeHidden();
  });

  test("un plato sin variantes se agrega con un toque desde la tarjeta", async ({ page }) => {
    const boton = page.getByRole("button", { name: /^Agregar / }).first();
    const etiqueta = (await boton.getAttribute("aria-label")) ?? (await boton.textContent()) ?? "";
    const plato = etiqueta.replace(/^Agregar /, "");

    await boton.click();
    await expect(page.getByText(`Agregaste ${plato}`)).toBeVisible();
  });
});
