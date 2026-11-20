import { expect, type Page, test } from "@playwright/test";

import { yearsOpen } from "../../src/config/site";
import { agregarSudados, botonCarrito, esperarHidratacion } from "./ayudas";

/** Años desde la apertura: el contador ya no es un «14» fijo, se calcula desde 2010. */
const ANOS = String(yearsOpen());

// Movimiento «marea», segunda tanda: foto que se destapa, parallax de la portada, línea bajo los
// títulos, destello del botón, contador «14» y plato que vuela al carrito (F2-09).
// Reglas: con «reducir movimiento» nada se anima y todo queda visible; con movimiento las
// animaciones existen y terminan con el contenido en su sitio.

const animacionDe = (page: Page, selector: string, pseudo?: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el, p ?? null).animationName, pseudo);

/** Plato que vuela: un círculo fijo que se agrega al body mientras dura el vuelo. */
const volador = (page: Page) =>
  page.locator('body > div[aria-hidden="true"][style*="position: fixed"]');

/** El número que cuenta, dentro de la sección «historia». */
const contador = (page: Page) =>
  page.locator("section[aria-labelledby='historia'] span.tabular-nums");

const soportaScrollDriven = (page: Page) =>
  page.evaluate(() => CSS.supports("animation-timeline: view()"));

test.describe("Movimiento 2 · con «reducir movimiento»", () => {
  test.use({ reducedMotion: "reduce" });

  test("nada se anima: foto, parallax, línea y destello quedan estáticos", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expect(await animacionDe(page, "[data-clip]")).toBe("none");
    expect(await animacionDe(page, ".parallax-texto")).toBe("none");
    expect(await animacionDe(page, ".parallax-media")).toBe("none");
    expect(await animacionDe(page, ".titulo-ola", "::after")).toBe("none");

    // La línea ají sigue ahí, estática: es parte de la marca.
    const alto = await page
      .locator(".titulo-ola")
      .first()
      .evaluate((el) => getComputedStyle(el, "::after").height);
    expect(alto).toBe("4px");
  });

  test("el contador muestra los años desde el principio y no cambia", async ({ page }) => {
    await page.goto("/");
    await expect(contador(page)).toHaveText(ANOS);
    await contador(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    await expect(contador(page)).toHaveText(ANOS);
  });

  test("agregar un plato no lanza el plato volador", async ({ page }) => {
    await page.goto("/carta/marina");
    await expect(page.getByLabel("Buscar en la carta")).toBeVisible();
    await esperarHidratacion(page, "#buscar-carta");

    await page
      .getByRole("button", { name: /^Agregar / })
      .first()
      .click();
    await expect(page.getByText(/^Agregaste /)).toBeVisible();
    await expect(volador(page)).toHaveCount(0);
  });
});

test.describe("Movimiento 2 · con animaciones", () => {
  test("las animaciones nuevas existen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    test.skip(!(await soportaScrollDriven(page)), "Este navegador no soporta animation-timeline.");

    expect(await animacionDe(page, "[data-clip]")).toBe("marea-destapa");
    expect(await animacionDe(page, ".parallax-texto")).toBe("marea-texto-sube");
    expect(await animacionDe(page, ".parallax-media")).toBe("marea-media-queda");
    expect(await animacionDe(page, ".titulo-ola", "::after")).toBe("marea-linea");
  });

  test("parallax: al bajar, el texto de la portada sube más que el scroll y el video se queda atrás", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    test.skip(!(await soportaScrollDriven(page)), "Este navegador no soporta animation-timeline.");

    const desplazamientoY = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const t = getComputedStyle(el).translate;
          return t === "none" ? 0 : Number.parseFloat(t.split(" ")[1] ?? "0");
        });

    // Al cargar casi no hay desplazamiento; al bajar, el texto sube más y el video se queda atrás.
    const textoAntes = await desplazamientoY(".parallax-texto");
    const mediaAntes = await desplazamientoY(".parallax-media");
    expect(Math.abs(textoAntes)).toBeLessThan(6);

    // 900 px: en celular el video está debajo del texto y recién ahí empieza a salir.
    await page.mouse.wheel(0, 900);
    await expect
      .poll(() => desplazamientoY(".parallax-texto"), { timeout: 4000 })
      .toBeLessThan(textoAntes - 10);
    await expect
      .poll(() => desplazamientoY(".parallax-media"), { timeout: 4000 })
      .toBeGreaterThan(mediaAntes + 10);
  });

  test("el botón principal tiene un destello que cruza al pasar el mouse (solo con mouse)", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "escritorio", "El toque no tiene hover.");
    await page.goto("/");
    const boton = page.getByRole("link", { name: "Pedir ahora" });
    await expect(boton).toBeVisible();
    const posicion = () => boton.evaluate((el) => getComputedStyle(el, "::after").translate);

    const antes = await posicion();
    await boton.hover();
    await expect.poll(posicion, { timeout: 3000 }).not.toBe(antes);
  });

  test("el contador arranca en 0, cuenta al llegar y termina en los años cumplidos", async ({
    page,
  }) => {
    await page.goto("/");
    // Fuera de pantalla espera en 0 (cuando la página ya hidrató).
    await expect(contador(page)).toHaveText("0");
    await contador(page).scrollIntoViewIfNeeded();
    await expect(contador(page)).toHaveText(ANOS, { timeout: 5000 });
  });

  test("al agregar un plato con un toque, el plato vuela al carrito y se retira", async ({
    page,
  }) => {
    await page.goto("/carta/marina");
    await expect(page.getByLabel("Buscar en la carta")).toBeVisible();
    await esperarHidratacion(page, "#buscar-carta");

    await page
      .getByRole("button", { name: /^Agregar / })
      .first()
      .click();
    await expect(page.getByText(/^Agregaste /)).toBeVisible();
    await expect(volador(page)).toHaveCount(1, { timeout: 1500 });
    await expect(volador(page)).toHaveCount(0, { timeout: 4000 });
    await expect(botonCarrito(page, 1).first()).toBeVisible();
  });

  test("al agregar desde la vista rápida el vuelo termina y el carrito suma", async ({ page }) => {
    await agregarSudados(page);
    await expect(volador(page)).toHaveCount(0, { timeout: 4000 });
    await expect(botonCarrito(page, 1).first()).toBeVisible();
  });
});
