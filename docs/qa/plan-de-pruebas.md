# Plan de pruebas – Berypez Web (MVP)

**Responsable:** Rafael (QA) · **Tarea:** F0-Q1 · **Versión:** 1.0 · **Fecha:** 2026-11-15
**Contrato:** [`README.md`](../../README.md) (fases y Definition of Done) · [`docs/api.md`](../api.md) (API interna)

> Regla de trabajo: Axel construye y Rafael verifica. Ninguna tarea se da por terminada sin la revisión
> y las pruebas descritas aquí.

---

## 1. Alcance

**Se prueba** todo lo que entrega el MVP: portada, carta (6 cartas), búsqueda y filtros, carrito, checkout,
pagos en modo prueba, seguimiento del pedido, panel del restaurante, reservas, Libro de Reclamaciones,
páginas legales y cookies, correos transaccionales, seguridad básica y rendimiento.

**No se prueba** (fuera del MVP): fidelización, QR en mesa, facturación SUNAT, multi-idioma, PWA y la
migración del dominio real.

**Regla de oro:** la web `berypez.pe` en producción no se toca. Todas las pruebas se hacen contra `localhost`,
los previews de Vercel o el proyecto `berypez-dev` de Supabase. Los pagos usan siempre claves de prueba.

## 2. Tipos de prueba

| Tipo                 | Herramienta                       | Quién  | Qué cubre                                                                                        |
| -------------------- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Unitarias            | Vitest + Testing Library          | Axel   | Lógica en `lib/`, `features/` y `app/api/`. Cobertura mínima del 80 %.                           |
| Revisión de PR       | Manual                            | Rafael | Lectura del diff, casos de la fase, prueba en el preview de Vercel.                              |
| E2E                  | Playwright (`tests/e2e/`)         | Rafael | Flujos críticos de punta a punta, en celular y escritorio.                                       |
| Manual exploratoria  | Dispositivos reales               | Rafael | Lo que la automatización no ve: tacto, legibilidad, textos confusos, pasos de más.               |
| Accesibilidad        | Teclado, TalkBack, VoiceOver, axe | Rafael | WCAG 2.2 AA (contraste, foco, lector de pantalla, zoom 200 %, movimiento reducido).              |
| Seguridad básica     | DevTools, scripts, `npm audit`    | Rafael | Precios manipulados, RLS con clave anon, firma del webhook, cabeceras, XSS, `/panel` sin sesión. |
| Rendimiento          | Lighthouse y k6                   | Rafael | LCP, CLS, INP, nodos del DOM; 200 usuarios simultáneos en carta, cotizador y checkout.           |
| Correos              | Gmail, Outlook, Hotmail           | Rafael | Llegada a bandeja, plantillas en celular y modo oscuro, reenvío con límite.                      |
| Pruebas con usuarios | Observación                       | Rafael | 3 personas (una mayor de 60) arman un pedido sin ayuda. Meta: menos de 3 minutos.                |

## 3. Entornos y datos

| Entorno                    | Uso                                                                                                           | Datos                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `localhost:3100`           | E2E de lectura (carta, rutas). Catálogo desde el _snapshot_ (`CATALOG_SOURCE=snapshot`), sin red ni Supabase. | 107 productos, 6 cartas.                          |
| `localhost` + `.env.local` | E2E que escriben (pedido, reserva, reclamo) y pruebas de RLS.                                                 | `berypez-dev` (claves que entrega Axel).          |
| Preview de Vercel          | Revisión de cada PR y pruebas en celulares reales.                                                            | `berypez-dev`.                                    |
| Demo estable               | Ensayo final y regresión completa.                                                                            | `berypez-demo` (se resetea antes de cada prueba). |

Reglas de datos:

- Los pedidos y reservas de prueba llevan el nombre `QA Rafael` y un celular de prueba, para poder limpiarlos.
- Turnstile con las claves de prueba de Cloudflare (siempre aprueba / siempre falla).
- Pasarela: solo tarjetas y casos de Yape publicados por Mercado Pago para sandbox
  (ver [`0001-pasarela-de-pagos.md`](../decisiones/0001-pasarela-de-pagos.md)).
- Nunca se usa una clave `service_role`/secret en el navegador ni en los tests de Playwright.

### Datos provisionales (confirmar con la dueña)

Hasta que la dueña confirme, estas pruebas se hacen con los valores provisionales de la app y se repiten
cuando cambien: horario 11:00–17:00 (hora de Lima), 7 zonas de reparto a S/ 7.50, aforo de reservas.

## 4. Dispositivos y navegadores

| Perfil                     | Dispositivo                     | Navegador             | Cuándo                          |
| -------------------------- | ------------------------------- | --------------------- | ------------------------------- |
| Celular Android gama media | Equipo real (o Pixel 7 emulado) | Chrome                | Cada PR y cada fase.            |
| iPhone                     | Equipo real                     | Safari                | Cada fase.                      |
| Tablet del local           | Tablet Android 10"              | Chrome                | Panel del restaurante (Fase 3). |
| Escritorio 1440 × 900      | Windows                         | Chrome, Firefox, Edge | Cada fase.                      |
| Celular pequeño 375 × 812  | Emulado                         | Chrome                | Cada PR (Definition of Done).   |

Automatizado en Playwright: proyectos `movil` (Pixel 7) y `escritorio` (1440 × 900) en Chrome. Con
`E2E_ALL_BROWSERS=1` se suman `safari-movil` (WebKit) y `firefox-escritorio` para la regresión de la Fase 5.

## 5. Severidades

| Severidad   | Definición                                                                       | Ejemplos                                                                    | Efecto                        |
| ----------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| **Crítico** | Pérdida de dinero o datos, brecha de seguridad o el flujo principal no funciona. | Se acepta un precio manipulado; anon lee pedidos ajenos; no se puede pedir. | Bloquea el merge y la demo.   |
| **Alto**    | Una función importante falla o hay una barrera seria de accesibilidad.           | Reserva sobre el aforo; el panel no recibe pedidos; botón sin foco.         | Bloquea el cierre de la fase. |
| **Medio**   | Falla con alternativa razonable o afecta a pocos casos.                          | Filtro que no limpia; texto cortado en un dispositivo.                      | Se corrige antes de la demo.  |
| **Bajo**    | Cosmético o de mejora.                                                           | Espaciado, ortografía, animación brusca.                                    | Se agenda.                    |

## 6. Cómo se reportan los bugs

Issue en GitHub con las etiquetas `bug`, `fase-N` y severidad (`crítico`, `alto`, `medio`, `bajo`):

1. **Título:** corto y específico.
2. **Pasos para reproducir** (numerados) y **datos usados**.
3. **Resultado esperado** y **resultado real**.
4. **Dispositivo, navegador y URL** (preview o localhost).
5. **Captura o video.** Si es de Playwright, adjuntar el _trace_.

## 7. Criterios para cerrar una fase

Una fase se cierra cuando se cumple todo lo siguiente:

- Las tablas de **desarrollo** (Axel) y de **QA** (Rafael) de la fase están completas.
- Los casos de `docs/qa/fase-N.md` están ejecutados y registrados.
- No hay bugs `crítico` ni `alto` abiertos.
- Los E2E de la fase pasan en la CI.
- Los criterios de aceptación del README de esa fase se midieron y se cumplen.
- La Definition of Done del README (sección 7) se cumple en cada PR de la fase.

## 8. Riesgos a vigilar (por impacto)

| #   | Riesgo                                                               | Prueba que lo cubre                                                   |
| --- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | El servidor acepta precios o totales enviados por el cliente         | F2-Q2: alterar precios y cantidades desde DevTools y por API directa. |
| 2   | RLS mal configurada expone pedidos, reservas o reclamos              | F4-Q2: con la clave anon, leer y escribir en cada tabla.              |
| 3   | Pagos duplicados o falsos                                            | F3-Q2: webhook con firma inválida, repetido y tardío.                 |
| 4   | Reserva sobre el aforo (condición de carrera)                        | F4-Q1: reservas simultáneas a la misma franja.                        |
| 5   | `/panel` y `/api/admin/*` accesibles sin sesión o con rol equivocado | E2E de acceso + pruebas de rol `cocina` vs `admin`.                   |
| 6   | Pedido fuera de horario o con recojo que exige dirección             | F2-Q1: casos límite del checkout.                                     |
| 7   | Datos del catálogo distintos a los de berypez.pe                     | F0-Q4 y F1-Q4: comparación y muestra de 20 platos.                    |
| 8   | Analítica cargada antes del consentimiento                           | F4-Q3: pestaña de red antes y después de aceptar cookies.             |
| 9   | Barreras de accesibilidad para personas mayores                      | F1-Q2, F2-Q4 y F5-01.                                                 |

## 9. Cobertura por fase

Estado al **2026-11-15**, sobre la rama `demo` (Axel). "E2E" son los de Playwright en `tests/e2e/`.

| Fase                  | Casos manuales      | E2E                                                      | Estado QA                                      |
| --------------------- | ------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| 0 Preparación         | F0-Q3, F0-Q4, F0-Q5 | Humo: portada y rutas públicas (hecho, F0-Q2)            | Plan y Playwright listos; catálogo por revisar |
| 1 Carta + portada     | `docs/qa/fase-1.md` | F1-14: carta → filtrar → buscar «seviche» → vista rápida | Pendiente                                      |
| 2 Carrito + checkout  | `docs/qa/fase-2.md` | F2-13: compra en efectivo con recojo                     | Pendiente (la app ya existe en `demo`)         |
| 3 Pagos + seguimiento | `docs/qa/fase-3.md` | F3-13: pago aprobado, rechazado y webhook                | Bloqueada: pagos y correos aún no construidos  |
| 4 Reservas + legal    | `docs/qa/fase-4.md` | F4-09: reservar → cancelar; reclamo → constancia         | Pendiente (la app ya existe en `demo`)         |
| 5 Calidad + demo      | Regresión y OWASP   | Suite completa en Chrome, Safari y Firefox               | Pendiente                                      |

### Orden de trabajo acordado

1. F0-Q1 plan de pruebas y F0-Q2 Playwright (este documento y `tests/e2e/`). ✅
2. Pruebas de mayor riesgo sobre lo ya construido: **F2-Q2** (precios manipulados), **F4-Q2** (RLS con anon),
   **F0-Q4** (catálogo importado).
3. E2E por flujo: carta (F1-14), compra en efectivo (F2-13), reserva y reclamo (F4-09).
4. Casos manuales de cada fase (`docs/qa/fase-N.md`).
5. Pagos y correos cuando Axel los entregue.

## 10. Cómo ejecutar las pruebas

```bash
npm ci
npx playwright install chromium     # una sola vez (navegador de las pruebas)

npm run e2e                         # todos los E2E (levanta `next dev` en el puerto 3100)
npm run e2e:ui                      # modo interactivo
npm run e2e:report                  # abre el último reporte HTML
npx playwright test --project=movil # solo celular
E2E_ALL_BROWSERS=1 npm run e2e      # suma Safari (WebKit) y Firefox
E2E_BASE_URL=https://<preview>.vercel.app npm run e2e   # contra un preview, sin servidor local
```

Si falla un E2E, el reporte (`playwright-report/`) trae captura, video y _trace_ del caso.

## 11. Entregables de QA

`docs/qa/plan-de-pruebas.md` (este archivo) · `docs/qa/fase-1.md` a `fase-4.md` · reportes por fase ·
`tests/e2e/` · issues de bugs · `docs/qa/informe-final.md` (F5-Q3) con la recomendación «listo / no listo» para la demo.
