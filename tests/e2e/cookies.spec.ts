import { expect, type Page, test } from "@playwright/test";

// F4-08 · Aviso de cookies (CK-01 a CK-05 de docs/qa/fase-4.md) y enlaces legales (LG-02).
// El servidor de pruebas se levanta con NEXT_PUBLIC_GA_ID=G-QATEST0001 (ver playwright.config.ts)
// para poder comprobar que Google Analytics solo se carga con consentimiento. Las llamadas a
// Google se interceptan: en ningún momento se envían datos reales.

const PATRON_GA = /googletagmanager\.com|google-analytics\.com/;
const CLAVE = "berypez:cookies";

async function vigilarAnalitica(page: Page) {
  const llamadas: string[] = [];
  await page.route(PATRON_GA, async (route) => {
    llamadas.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
  });
  return llamadas;
}

/**
 * Espera a que la página termine de cargar y da un margen para que, si hubiera un script de
 * analítica, alcance a pedirse. No se usa `networkidle`: en la CI nunca se alcanza porque la
 * portada tiene video y otros recursos (la prueba se quedaba colgada 30 s).
 */
async function dejarCargarScripts(page: Page) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);
}

const aviso = (page: Page) => page.getByRole("region", { name: "Cookies" });

test.describe("Cookies y analítica", () => {
  test("CK-01 · la primera visita muestra el aviso y NO carga analítica", async ({ page }) => {
    const llamadas = await vigilarAnalitica(page);
    await page.goto("/");

    await expect(aviso(page)).toBeVisible();
    await expect(aviso(page).getByRole("button", { name: "Aceptar" })).toBeVisible();
    await expect(aviso(page).getByRole("button", { name: "Solo necesarias" })).toBeVisible();

    await dejarCargarScripts(page);
    await page.goto("/carta/marina");
    await dejarCargarScripts(page);
    expect(llamadas, "Se cargó analítica antes de aceptar").toEqual([]);
  });

  test("CK-02 · al aceptar se guarda la decisión, desaparece el aviso y se carga GA4", async ({
    page,
  }) => {
    const llamadas = await vigilarAnalitica(page);
    await page.goto("/");

    await aviso(page).getByRole("button", { name: "Aceptar" }).click();
    await expect(aviso(page)).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), CLAVE)).toBe("accepted");
    await expect.poll(() => llamadas.length).toBeGreaterThan(0);
  });

  test("CK-03 · «Solo necesarias» no carga analítica y la decisión se recuerda", async ({
    page,
  }) => {
    const llamadas = await vigilarAnalitica(page);
    await page.goto("/");

    await aviso(page).getByRole("button", { name: "Solo necesarias" }).click();
    await expect(aviso(page)).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), CLAVE)).toBe("rejected");

    await page.reload();
    await dejarCargarScripts(page);
    await expect(aviso(page)).toBeHidden();
    expect(llamadas, "Se cargó analítica tras rechazar").toEqual([]);
  });

  test("CK-03 · al borrar la decisión, el aviso vuelve a aparecer", async ({ page }) => {
    await page.goto("/");
    await aviso(page).getByRole("button", { name: "Aceptar" }).click();
    await expect(aviso(page)).toBeHidden();

    await page.evaluate((k) => localStorage.removeItem(k), CLAVE);
    await page.reload();
    await expect(aviso(page)).toBeVisible();
  });

  test("CK-03 · una decisión aceptada se recuerda y mantiene la analítica activa", async ({
    page,
  }) => {
    await page.goto("/");
    await aviso(page).getByRole("button", { name: "Aceptar" }).click();

    const llamadas = await vigilarAnalitica(page);
    await page.reload();
    await expect(aviso(page)).toBeHidden();
    await expect.poll(() => llamadas.length).toBeGreaterThan(0);
  });

  test("CK-05 · se puede decidir solo con el teclado", async ({ page }) => {
    await page.goto("/");
    const rechazar = aviso(page).getByRole("button", { name: "Solo necesarias" });

    await rechazar.focus();
    await expect(rechazar).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(aviso(page)).toBeHidden();
  });

  test("el aviso enlaza a la política de privacidad", async ({ page }) => {
    await page.goto("/");
    await aviso(page).getByRole("link", { name: "Más información" }).click();
    await expect(page).toHaveURL(/\/privacidad$/);
  });

  test("si localStorage falla, el aviso no rompe la página", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("localStorage bloqueado");
        },
      });
    });
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/");
    await expect(aviso(page)).toBeVisible();
    await aviso(page).getByRole("button", { name: "Solo necesarias" }).click();
    await expect(aviso(page)).toBeHidden();
    expect(errores).toEqual([]);
  });
});

test.describe("Enlaces legales", () => {
  // Se decide el aviso de cookies antes: en el celular, en la primera visita el aviso queda fijo
  // justo encima de los dos últimos enlaces legales del pie y los tapa (ver QA-007).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((k) => localStorage.setItem(k, "rejected"), CLAVE);
  });

  const ENLACES = [
    ["Libro de Reclamaciones", "/libro-de-reclamaciones"],
    ["Términos y condiciones", "/terminos"],
    ["Política de privacidad", "/privacidad"],
    ["Cambios y devoluciones", "/devoluciones"],
  ] as const;

  test("LG-02 · el pie de página enlaza a las 4 páginas legales", async ({ page }) => {
    await page.goto("/");
    const pie = page.getByRole("contentinfo");
    for (const [nombre, href] of ENLACES) {
      await expect(pie.getByRole("link", { name: nombre })).toHaveAttribute("href", href);
    }
  });

  for (const [nombre, ruta] of ENLACES) {
    test(`LG-02 · desde el pie se llega a ${ruta}`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("contentinfo").getByRole("link", { name: nombre }).click();
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    });
  }
});

// QA-007 (#30) · detalles del aviso de cookies, verificados tras la corrección de Axel.
test.describe("Aviso de cookies · detalles (QA-007)", () => {
  test("el enlace del aviso dice a dónde lleva", async ({ page }) => {
    await page.goto("/");
    await expect(
      aviso(page).getByRole("link", { name: "Más información sobre cookies" }),
    ).toBeVisible();
  });

  test("la cabecera Permissions-Policy no usa funciones que Chrome ya no reconoce", async ({
    request,
  }) => {
    const respuesta = await request.get("/");
    const politica = respuesta.headers()["permissions-policy"] ?? "";
    expect(politica).not.toContain("browsing-topics");
  });

  test("sin decidir las cookies, los enlaces legales del pie se pueden tocar (también en celular)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(aviso(page)).toBeVisible();

    const enlace = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Política de privacidad" });
    await enlace.scrollIntoViewIfNeeded();
    await enlace.click({ timeout: 8000 });
    await expect(page).toHaveURL(/\/privacidad$/);
  });
});
