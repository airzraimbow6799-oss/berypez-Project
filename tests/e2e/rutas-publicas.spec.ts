import { expect, test } from "@playwright/test";

// Humo: cada página pública responde 200, tiene título propio y un h1.
// Las rutas con datos dinámicos (pedido, reserva) se prueban en sus flujos.
const RUTAS = [
  { ruta: "/", titulo: /Berypez/ },
  { ruta: "/carta/marina", titulo: /Marina/ },
  { ruta: "/carta/criolla", titulo: /Criolla/ },
  { ruta: "/carta/berycafe", titulo: /Bery/ },
  { ruta: "/carta/piqueos", titulo: /Piqueos/ },
  { ruta: "/carta/el-bar", titulo: /Bar/ },
  { ruta: "/carta/vegetariana", titulo: /Vegetariana/ },
  { ruta: "/buscar", titulo: /Buscar|Berypez/ },
  { ruta: "/nosotros", titulo: /Nosotros/ },
  { ruta: "/carrito", titulo: /Carrito/ },
  { ruta: "/checkout", titulo: /Berypez/ },
  { ruta: "/reservas", titulo: /Reservar/ },
  { ruta: "/terminos", titulo: /Términos/ },
  { ruta: "/privacidad", titulo: /Privacidad/ },
  { ruta: "/devoluciones", titulo: /Berypez/ },
  { ruta: "/libro-de-reclamaciones", titulo: /Libro de Reclamaciones/ },
];

for (const { ruta, titulo } of RUTAS) {
  test(`${ruta} responde y tiene título`, async ({ page }) => {
    // `domcontentloaded`: no se espera a las fotos, que en la CI se optimizan en el momento y a veces tardan.
    const respuesta = await page.goto(ruta, { waitUntil: "domcontentloaded" });
    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveTitle(titulo);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}

test("una ruta inexistente responde 404", async ({ page }) => {
  const respuesta = await page.goto("/esta-pagina-no-existe");
  expect(respuesta?.status()).toBe(404);
});

test("/panel sin sesión no muestra pedidos y manda a ingresar", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/panel\/ingresar/);
});

test("las secciones del panel sin sesión también mandan a ingresar", async ({ page }) => {
  for (const ruta of ["/panel/reservas", "/panel/sin-acceso"]) {
    await page.goto(ruta);
    await expect(page, ruta).toHaveURL(/\/panel\/ingresar/);
  }
});
