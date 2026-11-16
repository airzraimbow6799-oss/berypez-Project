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
    // BUG QA-006: la carta Marina (52 platos) supera el límite. Falla A PROPÓSITO hasta que se
    // reduzca el DOM (por ejemplo, cargando de forma diferida las secciones fuera de pantalla).
    test.fail(ruta === "/carta/marina", "QA-006: la carta Marina supera los 1 000 nodos");

    await page.goto(ruta);
    await page.waitForLoadState("networkidle");

    const nodos = await page.evaluate(() => document.querySelectorAll("*").length);
    info.annotations.push({ type: "nodos del DOM", description: String(nodos) });
    console.log(`[${info.project.name}] ${ruta}: ${nodos} nodos`);

    expect(nodos, `${ruta} tiene ${nodos} nodos`).toBeLessThan(LIMITE_NODOS);
  });
}
