import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas E2E (F0-Q2). Dos proyectos: celular (Android gama media) y escritorio.
 * Safari y Firefox se activan con E2E_ALL_BROWSERS=1 (regresión completa, F5-09).
 *
 * El servidor usa CATALOG_SOURCE=snapshot: la carta sale del snapshot versionado, así los
 * E2E de lectura corren sin red ni Supabase. Los flujos que escriben (pedido, reserva,
 * reclamo) necesitan `.env.local` con las claves de berypez-dev; ver docs/qa/plan-de-pruebas.md.
 */
const isCI = Boolean(process.env.CI);
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const allBrowsers = process.env.E2E_ALL_BROWSERS === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  // En local `next dev` compila cada página la primera vez. En CI el runner tiene poca CPU y las fotos se
  // optimizan en el momento: 60 s evita falsos rojos sin esconder una página realmente rota.
  timeout: isCI ? 60_000 : 90_000,
  expect: { timeout: 7_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    locale: "es-PE",
    timezoneId: "America/Lima",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    ...(allBrowsers
      ? [
          { name: "safari-movil", use: { ...devices["iPhone 14"] } },
          { name: "firefox-escritorio", use: { ...devices["Desktop Firefox"] } },
        ]
      : []),
  ],
  // Con E2E_BASE_URL se prueba un preview de Vercel y no se levanta servidor local.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: isCI
          ? `npm run build && npm run start -- -p ${port}`
          : `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 240_000,
        env: {
          CATALOG_SOURCE: "snapshot",
          NEXT_PUBLIC_SITE_URL: baseURL,
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ci-placeholder.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ci",
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          // ID falso: permite probar que GA4 solo carga con consentimiento (las llamadas se interceptan).
          NEXT_PUBLIC_GA_ID: "G-QATEST0001",
        },
      },
});
