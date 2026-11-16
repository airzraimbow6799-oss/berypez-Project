import { expect, test } from "@playwright/test";

// QA-009 · Carga inicial de las páginas públicas.
//
// BUG conocido: `src/app/(site)/loading.tsx` hace que TODAS las páginas se sirvan con el loader de
// los peces como contenido inicial y la página real dentro de un <div hidden id="S:0"> que un script
// de React muestra después. Efecto: se pinta primero el loader, luego el contenido salta y el pie de
// página se desplaza (CLS de hasta 0.5 en pantallas de escritorio, medido en un build de producción).
// Estas pruebas describen lo correcto y fallan A PROPÓSITO hasta que se corrija: cuando pasen,
// Playwright lo avisa y se quita la anotación `test.fail`.

const RUTAS = ["/", "/carta/marina", "/carta/criolla", "/nosotros", "/terminos"];

for (const ruta of RUTAS) {
  test(`QA-009 · ${ruta} se sirve con su contenido, sin loader de reemplazo`, async ({
    request,
  }) => {
    test.fail(true, "QA-009: loading.tsx se pinta primero y el contenido real llega oculto");

    const html = await (await request.get(ruta)).text();
    // Sin Suspense pendiente: no hay plantilla de reemplazo ni contenido escondido.
    expect(html).not.toContain('<template id="B:0"');
    expect(html).not.toContain('<div hidden id="S:0"');
  });
}
