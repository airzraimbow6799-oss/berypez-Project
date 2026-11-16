import { expect, test } from "@playwright/test";

// F1-Q3 · Medición (M-03 de docs/qa/fase-1.md): criterio del README = menos de 1 000 nodos en el DOM
// de la carta. Se mide cada carta en móvil y escritorio y el número queda en el reporte.

const RUTAS = [
  "/",
  "/carta/marina",
  "/carta/criolla",
  "/carta/berycafe",
  "/carta/piqueos",
  "/carta/el-bar",
  "/carta/vegetariana",
];
const LIMITE_NODOS = 1000;

for (const ruta of RUTAS) {
  test(`M-03 · ${ruta} tiene menos de ${LIMITE_NODOS} nodos en el DOM`, async ({ page }, info) => {
    // QA-006 (corregido): la carta Marina (52 platos) tenía ~1 215 nodos. Ahora la tarjeta es el
    // propio <li> y el «+» es CSS (≈ 949 nodos). Esta prueba evita que vuelva a pasar del límite.

    await page.goto(ruta, { waitUntil: "domcontentloaded" });
    // Sin `networkidle`: en la CI nunca se alcanza (video y recursos externos). Se espera al HTML, a que
    // aparezca el título y un margen para la hidratación (sin esperar a las fotos).
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForTimeout(1500);

    const nodos = await page.evaluate(() => document.querySelectorAll("*").length);
    info.annotations.push({ type: "nodos del DOM", description: String(nodos) });
    console.log(`[${info.project.name}] ${ruta}: ${nodos} nodos`);

    expect(nodos, `${ruta} tiene ${nodos} nodos`).toBeLessThan(LIMITE_NODOS);
  });
}
