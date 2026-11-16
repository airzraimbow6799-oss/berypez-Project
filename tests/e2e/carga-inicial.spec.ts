import { expect, test } from "@playwright/test";

// QA-009 · Carga inicial de las páginas públicas (corregido).
//
// Antes, `src/app/(site)/loading.tsx` hacía que TODAS las páginas se sirvieran con el loader de los
// peces como contenido inicial y la página real dentro de un <div hidden id="S:0"> que un script de
// React mostraba después: se pintaba el loader, luego el contenido saltaba (CLS de hasta 0.5).
// Se quitó ese archivo: el aviso entre páginas lo da NavigationLoader (sobre la página actual, sin
// reemplazarla). Estas pruebas protegen que no vuelva a pasar.

const RUTAS = ["/", "/carta/marina", "/carta/criolla", "/nosotros", "/terminos"];

for (const ruta of RUTAS) {
  test(`QA-009 · ${ruta} se sirve con su contenido, sin loader de reemplazo`, async ({
    request,
  }) => {
    const html = await (await request.get(ruta)).text();
    // Sin Suspense pendiente: no hay plantilla de reemplazo ni contenido escondido.
    expect(html).not.toContain('<template id="B:0"');
    expect(html).not.toContain('<div hidden id="S:0"');
  });
}
