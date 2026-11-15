# Berypez Web – MVP funcional

MVP de la nueva web de **Berypez** (cocina marina y criolla, sedes Lince y Jesús María), basado en la auditoría y en la propuesta
[`docs/propuesta/Propuesta_Mejora_Web_Berypez.pdf`](docs/propuesta/Propuesta_Mejora_Web_Berypez.pdf) (v2.0).

El objetivo del MVP es tener una **demo funcional que se pueda mostrar a la dueña** con la carta real. Debe permitir:

- ver la carta,
- armar un pedido,
- pagar en modo prueba,
- reservar mesa.

Todo esto sin tocar la web en producción.

**Equipo**

| Persona    | Rol principal         | Responsable de                                                                                                                                                                                                                                                      |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Axel**   | Desarrollo full-stack | Todo el código: frontend (diseño, componentes, carta, carrito, checkout, animaciones, accesibilidad) y backend (Supabase, API interna, pedidos, envíos, pagos, reservas, correos, despliegue en Vercel, seguridad). Escribe los tests unitarios de su código (TDD). |
| **Rafael** | QA / Pruebas          | La calidad de todo lo que entrega Axel: plan de pruebas, pruebas E2E con Playwright, pruebas manuales en celulares reales, accesibilidad, seguridad básica, carga, correos y pagos de prueba. Revisa y prueba cada PR antes del merge y reporta los bugs.           |

> **Regla de trabajo:** Axel construye y Rafael verifica. Ninguna tarea de Axel se da por terminada sin la revisión y las pruebas de Rafael (ver la sección 7).

---

## Índice

1. [Alcance del MVP](#1-alcance-del-mvp)
2. [Stack y arquitectura](#2-stack-y-arquitectura)
   - [2.1 Capas de seguridad (Vercel, Turnstile, Resend, RLS)](#21-capas-de-seguridad)
   - [2.2 Uso de Cloudflare: solo Turnstile](#22-uso-de-cloudflare-solo-turnstile)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Forma de trabajo](#4-forma-de-trabajo)
5. [Fases](#5-fases)
   - [Fase 0 · Preparación](#fase-0--preparación-semanas-1-2)
   - [Fase 1 · Carta digital + portada](#fase-1--carta-digital--portada-semanas-3-5)
   - [Fase 2 · Carrito y checkout](#fase-2--carrito-y-checkout-semanas-6-8)
   - [Fase 3 · Pagos y seguimiento](#fase-3--pagos-y-seguimiento-semanas-9-11)
   - [Fase 4 · Reservas y legal](#fase-4--reservas-y-legal-semanas-12-13)
   - [Fase 5 · Calidad, demo y entrega](#fase-5--calidad-demo-y-entrega-semana-14)
6. [Resumen de responsabilidades](#6-resumen-de-responsabilidades)
7. [Definition of Done](#7-definition-of-done-todas-las-fases)
8. [Riesgos](#8-riesgos)
9. [Pendientes con la dueña](#9-pendientes-con-la-dueña)
10. [Cómo arrancar](#10-cómo-arrancar)

---

## 1. Alcance del MVP

**Incluye**

| Módulo              | Qué debe hacer                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portada (HERO)      | Presentar la marca, sedes, horarios y llamadas a la acción: “Pedir ahora”, “Reservar” y “Ver carta”.                                                                                               |
| Header / navegación | Menú completo, selector de sede y modalidad (delivery o recojo), carrito, WhatsApp y barra inferior en celular.                                                                                    |
| Carta interactiva   | Las 6 cartas (Marina, Criolla, Berycafé, Piqueos, El Bar, Vegetariana) en cuadrícula (no carruseles), con barra de categorías, filtros, búsqueda tolerante a errores y vista rápida con variantes. |
| Carrito             | Añadir sin recargar, confirmación en menos de 300 ms, notas por plato y sugerencias de bebidas.                                                                                                    |
| Checkout            | Una página, con validación antes de pagar. La dirección solo se pide en delivery. El recojo se hace por sede. Tarifa por zona.                                                                     |
| Pagos (modo prueba) | Yape, Plin y tarjeta mediante la pasarela en **sandbox**, más la opción de efectivo contra entrega.                                                                                                |
| Seguimiento         | Página de estado del pedido: Recibido → En cocina → En camino → Entregado.                                                                                                                         |
| Panel mínimo        | Vista para el restaurante con los pedidos entrantes y el cambio de estado.                                                                                                                         |
| Reservas            | Sede, fecha, hora, número de personas y confirmación.                                                                                                                                              |
| Legal               | Libro de Reclamaciones virtual, términos y condiciones, privacidad y aviso de cookies.                                                                                                             |

**No incluye en el MVP** (queda para después): fidelización, QR en mesa, facturación electrónica SUNAT, multi-idioma, PWA y migración del dominio real.

**Regla de oro:** la web en producción `berypez.pe` **solo se lee**, una única vez, para importar el catálogo con la API pública. Nunca se crean pedidos, reservas ni pagos en producción. Todos los datos del MVP viven en **Supabase**.

---

## 2. Stack y arquitectura

| Capa                | Tecnología                                                                               | Motivo                                                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend            | **Next.js 15 (App Router) + TypeScript + Tailwind CSS**                                  | Rápido (SSR/ISR), buen SEO y componentes reutilizables.                                                                                                                                                                                                    |
| Animación           | **Framer Motion** (+ Lottie puntual)                                                     | Transiciones de la propuesta, con soporte de `prefers-reduced-motion`.                                                                                                                                                                                     |
| Backend (prototipo) | **Supabase**: Postgres, Auth, Storage, Realtime                                          | Un solo servicio para catálogo, pedidos, reservas, reclamos, login del panel, fotos y actualizaciones en vivo.                                                                                                                                             |
| Acceso a datos      | **supabase-js** + tipos generados (`supabase gen types`)                                 | Tipado de punta a punta sin un ORM extra. Las políticas RLS se aplican de forma nativa.                                                                                                                                                                    |
| Migraciones         | **Supabase CLI** (`supabase/migrations/*.sql`)                                           | Esquema versionado en el repo y aplicado igual en desarrollo y en producción.                                                                                                                                                                              |
| API interna (BFF)   | **Route Handlers de Next.js** (`/app/api/*`) en Vercel                                   | Recalcula precios, crea pedidos, cobra y recibe webhooks con la clave de servicio, que nunca llega al navegador.                                                                                                                                           |
| Pagos               | Pasarela peruana en **sandbox** (Culqi, Izipay o Mercado Pago, a definir en la Fase 0)   | Yape, Plin y tarjeta con confirmación automática por webhook.                                                                                                                                                                                              |
| Correos             | **Resend** + **React Email** (plantillas)                                                | Envío y reenvío de correos transaccionales: confirmación de pedido, cambio de estado, reserva y recordatorio, constancia del Libro de Reclamaciones y enlaces de acceso al panel. Dominio propio verificado (SPF, DKIM, DMARC) para que no caigan en spam. |
| WhatsApp            | Enlace prellenado (`wa.me`) en el MVP                                                    | Contacto directo con la sede.                                                                                                                                                                                                                              |
| Antibots            | **Cloudflare Turnstile** (es lo único que se usa de Cloudflare, ver 2.2)                 | Protege los formularios públicos (checkout, reservas, reclamos, login) de bots y spam. La seguridad del tráfico la da Vercel (DDoS, firewall, Bot Management).                                                                                             |
| Tests               | **Vitest** + Testing Library (unitarios) y **Playwright** (E2E)                          | Cobertura mínima del 80 % y flujos críticos probados.                                                                                                                                                                                                      |
| Calidad             | ESLint, Prettier, TypeScript estricto y Lighthouse CI                                    | Métricas de rendimiento y accesibilidad en cada PR.                                                                                                                                                                                                        |
| Despliegue          | **Vercel** (frontend + API) + **Supabase** (2 proyectos: `berypez-dev` y `berypez-demo`) | Un preview por PR para mostrar avances; la demo se presenta con datos separados de los de desarrollo.                                                                                                                                                      |

```
 Cliente (navegador / celular)
            │
            ▼
 ┌────────────── VERCEL ─────────────────────────────────────────┐
 │                                                               │
 │  Next.js (Axel)                     API interna /api/* (BFF)  │
 │  páginas, componentes,   ──fetch──► (Axel, clave service)     │
 │  carrito (estado local)             checkout · pagos ·        │
 │        │                            webhooks · reclamos       │
 └────────┼──────────────────────────────────┬───────────────────┘
          │ lecturas públicas (anon + RLS)   │ escrituras protegidas
          │ y Realtime (panel / seguimiento) │
          ▼                                  ▼
 ┌────────────── SUPABASE ───────────────────────────────────────┐
 │  Postgres: products, variants, menus, categories, branches,   │
 │            delivery_zones, orders, order_items, reservations, │
 │            complaints, payment_events                         │
 │  Auth: personal del panel (admin / cocina)                    │
 │  Storage: fotos de platos  ·  Realtime: pedidos y estados     │
 └───────────────────────────────────────────────────────────────┘
          ▲                                          ▲
          │ importación única (solo lectura)         │ webhook
  berypez.pe /wp-json/wc/store/v1/products   Pasarela (sandbox) → /api/payments/webhook
```

**Quién usa qué clave**

| Clave                                      | Dónde                      | Para qué                                                                                                                              |
| ------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Publishable `sb_publishable_…` (pública)   | Navegador                  | Leer la carta, las sedes y las zonas, y escuchar el estado de **su** pedido por Realtime. Las políticas RLS limitan lo que puede ver. |
| Secreta `sb_secret_…` (rol `service_role`) | Solo en `/api/*` en Vercel | Crear pedidos con el precio recalculado, registrar pagos y reclamos. **Nunca** va al navegador.                                       |
| Sesión del personal                        | Panel `/panel`             | Supabase Auth con rol `admin` o `cocina`; RLS solo les deja ver y cambiar pedidos y reservas.                                         |
| `RESEND_API_KEY` (secreta)                 | Solo en `/api/*` en Vercel | Enviar correos. Con permiso solo de envío (_sending access_) y limitada al dominio del proyecto.                                      |
| `TURNSTILE_SECRET_KEY` (secreta)           | Solo en `/api/*` en Vercel | Validar en el servidor el token antibots de cada formulario. La _site key_ sí es pública.                                             |

### 2.1 Capas de seguridad

```
 Usuario ──HTTPS──► Vercel (DDoS automático · Bot Management · WAF · Next.js + /api) ──► Supabase (RLS)
                       │                                         │
                       └── widget Cloudflare Turnstile ──────────┴─► verificación del token en el servidor
                                                                 └─► Resend (correos firmados SPF/DKIM/DMARC)
```

| Capa                 | Herramienta                                                                        | Qué protege                                                                                    | Dueño                         |
| -------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| Tráfico              | **Vercel**: mitigación DDoS automática, Bot Management y reglas WAF personalizadas | Bloquea ataques comunes, escaneos y tráfico abusivo.                                           | R                             |
| Límite de peticiones | Límite en `/api/*` (F2-15), más reglas de Vercel si hacen falta                    | Máximo de intentos por IP en checkout, pagos, reservas, reclamos y login.                      | R                             |
| Formularios          | **Cloudflare Turnstile**                                                           | Antibots sin captcha molesto (invisible para la mayoría de personas y accesible para mayores). | A (widget) + R (verificación) |
| Aplicación           | Next.js + Zod + cabeceras (CSP, HSTS)                                              | Validación de entradas, precios recalculados en el servidor y ningún secreto en el navegador.  | R                             |
| Datos                | **Supabase RLS**                                                                   | Cada quien ve solo lo que le corresponde.                                                      | R                             |
| Pagos                | Firma del webhook de la pasarela + idempotencia                                    | Evita pagos falsos o duplicados.                                                               | R                             |
| Correo               | **Resend** con SPF, DKIM y DMARC                                                   | Los correos llegan a la bandeja de entrada y no se pueden suplantar.                           | R                             |

### 2.2 Uso de Cloudflare: solo Turnstile

**Decisión:** de Cloudflare se usa **únicamente Turnstile**, el antibots de los formularios. No se usan el DNS, el proxy, el WAF ni la caché de Cloudflare.

- **Cómo funciona:** Turnstile solo necesita una cuenta gratuita de Cloudflare y registrar los dominios donde se mostrará el widget (`localhost`, el dominio de Vercel y el de la demo). El dominio **no** tiene que estar en Cloudflare.
- **Dónde se usa:** checkout, reservas, Libro de Reclamaciones y login del panel. Axel pone el widget y valida el token en `/api/*` con `TURNSTILE_SECRET_KEY` antes de guardar nada.
- **DNS:** lo maneja el proveedor del dominio o Vercel DNS. Ahí se cargan los registros de Vercel y los de Resend (SPF, DKIM, DMARC).
- **Por qué no se usa el proxy de Cloudflare:** Vercel desaconseja poner un proxy delante. Su firewall pierde las IPs reales de los clientes, su protección antibots deja de funcionar y aparecen problemas de doble caché, certificados SSL y bucles de redirección. Vercel ya incluye DDoS, firewall y protección antibots ([Vercel – Cloudflare con Vercel](https://vercel.com/kb/guide/cloudflare-with-vercel), [Vercel – Reverse proxy](https://vercel.com/docs/security/reverse-proxy)).
- **Claves de prueba:** Cloudflare publica _site keys_ y _secret keys_ de prueba que siempre aprueban o siempre fallan. Se usan en desarrollo y en los tests E2E, para no depender del widget real.

**Contrato de datos:** los tipos generados de Supabase (`src/types/database.ts`), los tipos de dominio (`src/types`) y las rutas `/api/*` documentadas en `docs/api.md`. Axel los mantiene. Rafael los usa para escribir los casos de prueba y los E2E. Los **mocks** (MSW) permiten trabajar la UI y las pruebas aunque una ruta todavía no exista.

---

## 3. Estructura del repositorio

```
berypez-web/
├─ README.md                  ← este archivo
├─ docs/
│  ├─ qa/                     ← plan de pruebas, casos y reportes por fase (Rafael)
│  ├─ api.md                  ← contrato de la API interna (Axel)
│  ├─ design-system.md        ← tokens, tipografía, componentes (Axel)
│  └─ decisiones/             ← ADRs (pasarela elegida, etc.)
├─ src/
│  ├─ app/                    ← páginas Next.js (Axel)
│  │  ├─ (site)/              ← inicio, cartas, carrito, checkout, reservas, legales
│  │  ├─ panel/               ← panel del restaurante (Axel)
│  │  └─ api/                 ← route handlers / BFF (Axel)
│  ├─ components/             ← UI reutilizable (Axel)
│  ├─ features/               ← carta, carrito, checkout, reservas… (por dominio)
│  ├─ lib/
│  │  ├─ supabase/            ← clientes browser / server / service (Axel)
│  │  ├─ payments/            ← adaptador de pasarela (Axel)
│  │  └─ validation/          ← esquemas Zod compartidos (ambos)
│  ├─ types/                  ← database.ts (generado) + tipos de dominio (Axel)
│  └─ styles/                 ← tokens CSS (Axel)
├─ supabase/
│  ├─ migrations/             ← SQL versionado: tablas, índices, RLS (Axel)
│  └─ seed.sql                ← sedes, zonas y datos de demo (Axel)
├─ scripts/
│  └─ import-catalog.ts       ← berypez.pe (solo lectura) → Supabase (Axel)
├─ mocks/                     ← MSW handlers para desarrollo sin backend (Axel)
├─ tests/
│  ├─ unit/                   ← tests unitarios extra (Axel; la mayoría va junto al código)
│  └─ e2e/                    ← Playwright (Rafael)
└─ .github/workflows/         ← CI: lint, tests, build, Lighthouse (Axel)
```

---

## 4. Forma de trabajo

- **Ramas:** `main` (estable y demo), `develop` (integración) y `feat/<fase>-<tema>`, por ejemplo `feat/f1-carta-grid`.
- **Commits:** convencionales (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- **Pull Requests:** Axel abre el PR y Rafael lo revisa y lo prueba en el preview de Vercel. Se mergea solo con la CI en verde y la aprobación de Rafael.
- **Bugs:** Rafael los reporta como _issues_ con pasos para reproducir, resultado esperado, resultado real, dispositivo y captura. Etiquetas `bug`, `fase-N` y severidad (`crítico`, `alto`, `medio`, `bajo`).
- **TDD (Axel):** primero el test unitario, luego el código. Cobertura de al menos el 80 % en `lib/`, `features/` y `app/api/`.
- **E2E y QA (Rafael):** los flujos críticos se cubren con Playwright en `tests/e2e/`. Rafael empieza a escribir los casos de cada fase cuando arranca la fase, sin esperar a que Axel termine.
- **Tablero:** una columna por fase (Trello o GitHub Projects). Cada tarea de este README es una tarjeta con su ID.
- **Sincronización:** 15 minutos diarios, más una demo al final de cada fase para mostrar avances (link de preview de Vercel).
- **Secretos:** solo en `.env.local` y en Vercel. Nunca en el repo. Se versiona `.env.example`.

---

## 5. Fases

Leyenda: **A** = Axel (desarrollo) · **R** = Rafael (QA/pruebas) · **A+R** = en pareja · 🔗 = depende de otra tarea.

Cada fase tiene una tabla de **desarrollo** (Axel) y una de **QA** (Rafael). La fase se cierra cuando las dos están completas.

### Fase 0 · Preparación (semanas 1-2)

**Objetivo:** dejar listas la base técnica, las cuentas, los datos y el diseño para que Axel desarrolle sin bloqueos, y que Rafael tenga listo su plan de pruebas desde el inicio.

**Desarrollo (Axel)**

| ID    | Tarea                          | Quién          | Detalle                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0-01 | Crear repo y proyecto base     | **A**          | Next.js 15 + TS estricto + Tailwind, ESLint/Prettier, Husky + lint-staged, `.env.example`.                                                                                                                                                                                                                                                                                   |
| F0-02 | CI en GitHub Actions           | **A**          | lint → typecheck → tests → build. Lighthouse CI en modo informativo.                                                                                                                                                                                                                                                                                                         |
| F0-13 | Turnstile                      | **A**          | Crear la cuenta gratuita de Cloudflare y el widget de **Turnstile** (modo _managed_) con los dominios `localhost`, `*.vercel.app` del proyecto y el de la demo. Guardar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en Vercel. Documentar en `docs/seguridad.md` (ver 2.2).                                                                                    |
| F0-14 | Resend                         | **A**          | Crear la cuenta, verificar el dominio de envío (por ejemplo `pedidos@<dominio>`) con SPF, DKIM y DMARC cargados en el DNS del dominio (proveedor o Vercel DNS), y crear la API key solo de envío. Enviar un correo de prueba.                                                                                                                                                |
| F0-03 | Proyectos Supabase + Vercel    | **A**          | Crear `berypez-dev` y `berypez-demo` en Supabase. Conectar el repo a Vercel. Variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY` (esta última solo en el servidor). Integración Supabase ↔ Vercel.                                                                                                                          |
| F0-04 | Importar y limpiar el catálogo | **A**          | `scripts/import-catalog.ts` **lee** la API pública de berypez.pe y carga `products`, `variants`, `categories` y `menus` en Supabase. Sube las fotos a Storage convertidas a WebP. En la misma carga: quitar “(Copiar)” y “Nov 24”, categorizar Gaseosas/Cervezas/Bebidas calientes y mapear categorías → 6 cartas (Anexo B de la propuesta).                                 |
| F0-05 | Contrato de datos v1           | **A**          | `src/types` + `docs/api.md`: `Product`, `Variant`, `Menu`, `Category`, `CartItem`, `Cart`, `Branch`, `DeliveryZone`. Rafael lo revisa para preparar los casos de prueba.                                                                                                                                                                                                     |
| F0-06 | Esquema y seguridad            | **A**          | Migraciones SQL en `supabase/migrations`: `branches`, `delivery_zones`, `orders`, `order_items`, `reservations`, `complaints`, `payment_events`, `staff_roles`. **RLS activado en todas las tablas**: lectura pública solo para la carta, las sedes y las zonas, y escritura solo por el servidor o el personal autenticado. `supabase gen types` → `src/types/database.ts`. |
| F0-07 | Elegir pasarela (sandbox)      | **A**          | Comparar Culqi, Izipay y Mercado Pago (Yape/Plin/tarjeta, comisiones, webhooks) y abrir una cuenta de pruebas. Registrar la decisión en `docs/decisiones/`.                                                                                                                                                                                                                  |
| F0-08 | Sistema de diseño              | **A**          | Tokens en `styles/tokens.css`. Paleta: azul marino `#082F49`, ají amarillo `#F2B33D`, rocoto `#E4572E`, crema `#FBF7F0`, limón `#7BB661`. Tipografía Fraunces + Inter, escala tipográfica, espaciados, radios y sombras. Modo oscuro opcional.                                                                                                                               |
| F0-09 | Componentes base               | **A**          | `Button`, `IconButton`, `Chip`, `Badge`, `Card`, `Sheet`/`Modal`, `Drawer`, `Input`, `Select`, `Stepper`, `Skeleton`, `Toast`. Accesibles (foco, ARIA) y con tests.                                                                                                                                                                                                          |
| F0-10 | Wireframes / prototipo         | **A**          | Figma o prototipo en código de: inicio, carta, vista rápida, carrito, checkout, pago, seguimiento y reserva, en móvil y escritorio. Validación con Rafael (datos) y con el cliente.                                                                                                                                                                                          |
| F0-11 | Mocks de API                   | **A** 🔗 F0-05 | MSW con datos reales exportados del catálogo para trabajar sin backend.                                                                                                                                                                                                                                                                                                      |
| F0-12 | Layout global                  | **A**          | `Header` (selector sede/modalidad, carrito, WhatsApp), `Footer` (sedes, horarios, legales, medios de pago), barra inferior móvil, `SkipLink`.                                                                                                                                                                                                                                |

**QA (Rafael)**

| ID    | Tarea de QA                     | Quién          | Detalle                                                                                                                                                                                                                                   |
| ----- | ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0-Q1 | Plan de pruebas                 | **R**          | `docs/qa/plan-de-pruebas.md`: alcance, tipos de prueba por fase, matriz de dispositivos (Android gama media, iPhone, tablet del local y escritorio), navegadores (Chrome, Safari, Firefox), severidades y criterios para cerrar una fase. |
| F0-Q2 | Playwright                      | **R**          | Instalar y configurar Playwright en `tests/e2e/` (proyectos móvil y escritorio, capturas y video si falla, reporte HTML) y sumarlo a la CI. Primera prueba: la home carga y tiene título.                                                 |
| F0-Q3 | Casos de prueba de la Fase 1    | **R** 🔗 F0-05 | A partir del contrato de datos y del prototipo, escribir en `docs/qa/fase-1.md` los casos de la carta (navegación, filtros, búsqueda, variantes, accesibilidad).                                                                          |
| F0-Q4 | Revisión del catálogo importado | **R** 🔗 F0-04 | Comparar las 6 cartas de berypez.pe contra lo importado en Supabase: cantidad, precios, variantes y fotos. Confirmar que no quedaron “(Copiar)”, “Nov 24” ni productos sin categoría.                                                     |
| F0-Q5 | QA del prototipo                | **R** 🔗 F0-10 | Recorrer el prototipo en celular como cliente nuevo y como persona mayor. Reportar textos confusos, botones pequeños y pasos de más.                                                                                                      |

**Entregables:** repo con CI verde · Supabase con el catálogo limpio y RLS · preview de Vercel funcionando · contrato v1 aprobado · sistema de diseño y componentes base · prototipo aprobado.
**Criterio de salida:**

- `npm run dev` levanta la web con layout y mocks.
- `berypez-dev` tiene los 107 productos con fotos en Storage.
- Cada PR genera su preview en Vercel.

---

### Fase 1 · Carta digital + portada (semanas 3-5)

**Objetivo:** la carta real, rápida y navegable, más la portada nueva. Es lo primero que se le muestra a la dueña.

**Desarrollo (Axel)**

| ID    | Tarea                      | Quién          | Detalle                                                                                                                                                                                                                                     |
| ----- | -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1-01 | Capa de datos del catálogo | **A**          | `lib/supabase/` con clientes browser/server y consultas `getMenus`, `getMenu(slug)` y `getProduct(slug)` con variantes, sin consultas N+1 (joins). Manejo de errores y tests con fixtures.                                                  |
| F1-02 | Endpoints de catálogo      | **A**          | `GET /api/menus`, `GET /api/menus/:slug`, `GET /api/products/:slug`. Devuelven los tipos del contrato, con caché ISR (revalidar cada 10 min) y `revalidateTag` disparado por un webhook de base de datos de Supabase al editar un producto. |
| F1-03 | Búsqueda                   | **A**          | `GET /api/search?q=`: tolerante a errores (“seviche” → Ceviche) y a tildes, con sinónimos. Puede usar Fuse.js en el servidor.                                                                                                               |
| F1-04 | Etiquetas y metadatos      | **A**          | Columnas `tags` (picante, vegetariano, compartir, favorito, niños), `allergens` y `portion` en `products`, expuestas en la API.                                                                                                             |
| F1-05 | Imágenes                   | **A**          | `next/image` sobre Supabase Storage (WebP/AVIF, tamaños responsivos, ancho y alto declarados), bucket público, `remotePatterns` y `sizes` por componente.                                                                                   |
| F1-15 | Edición rápida de la carta | **A**          | Mientras no exista un panel de carta, el personal edita precios, fotos y “agotado” desde el Table Editor de Supabase. R documenta cómo hacerlo en `docs/editar-carta.md`.                                                                   |
| F1-06 | Portada / HERO             | **A**          | Titular, fondo (foto o video con fallback), CTA “Pedir ahora / Reservar / Ver carta”, chips (tiempo, desde S/ 7.50, medios de pago) y plato estrella.                                                                                       |
| F1-07 | Secciones de portada       | **A**          | Accesos a las 6 cartas, lo más pedido, combos, historia (Berla y Julio), sedes con mapa y horarios, reseñas (placeholder).                                                                                                                  |
| F1-08 | Página de carta            | **A** 🔗 F1-02 | Cuadrícula responsiva (2 columnas en móvil, 3-4 en escritorio), barra de categorías fija con scroll-spy, pestañas entre cartas sin recargar.                                                                                                |
| F1-09 | Tarjeta de plato           | **A**          | Foto 4:3, nombre, descripción en 2 líneas, precio o “desde”, etiquetas y botón “+”.                                                                                                                                                         |
| F1-10 | Vista rápida               | **A** 🔗 F1-02 | Hoja inferior en móvil y modal en escritorio. Variantes con botones grandes, precio en vivo, extras, nota para cocina y rótulos claros (“Elige tu pescado”).                                                                                |
| F1-11 | Filtros y búsqueda (UI)    | **A** 🔗 F1-03 | Chips (sin picante, vegetariano, niños, compartir, hasta S/ 40) y buscador con sugerencias instantáneas.                                                                                                                                    |
| F1-12 | Animaciones base           | **A**          | Aparición al hacer scroll, hover de tarjetas, transición entre cartas y skeletons. Todo respeta `prefers-reduced-motion`.                                                                                                                   |
| F1-13 | SEO                        | **A**          | Metadatos por página, `sitemap.xml` y JSON-LD `Restaurant`/`Menu`/`Product` por sede insertado en el layout.                                                                                                                                |
| F1-14 | E2E de carta               | **R**          | Playwright: abrir carta → filtrar → buscar “seviche” → abrir vista rápida → elegir variante.                                                                                                                                                |

**QA (Rafael)**

| ID    | Tarea de QA               | Quién | Detalle                                                                                                              |
| ----- | ------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| F1-Q1 | QA manual de la carta     | **R** | Ejecutar los casos de `docs/qa/fase-1.md` en la matriz de dispositivos y reportar los bugs.                          |
| F1-Q2 | Accesibilidad de la carta | **R** | Navegación solo con teclado, lector de pantalla (TalkBack y VoiceOver), zoom al 200 % y modo de movimiento reducido. |
| F1-Q3 | Medición                  | **R** | Lighthouse móvil en `/` y `/carta/marina` y conteo de nodos del DOM, con resultados en `docs/qa/fase-1.md`.          |
| F1-Q4 | Exactitud de datos        | **R** | Muestra de 20 platos: nombre, precio, variantes y foto iguales a los de Supabase.                                    |
| F1-Q5 | Casos de la Fase 2        | **R** | Escribir `docs/qa/fase-2.md` (carrito, checkout, sedes, zonas, horario).                                             |

**Entregables:** portada y 6 cartas funcionando con los datos reales importados en Supabase, publicadas en el preview de Vercel.
**Criterios de aceptación:**

- Lighthouse móvil: rendimiento ≥ 85 y accesibilidad ≥ 95 en `/` y `/carta/marina`.
- LCP < 2.5 s en 4G simulado y DOM < 1,000 nodos en la carta.
- Ningún producto duplicado o sin categoría visible.
- “seviche” devuelve ceviches.

---

### Fase 2 · Carrito y checkout (semanas 6-8)

**Objetivo:** que el cliente arme su pedido y lo envíe (pagando en efectivo contra entrega). Los pagos en línea llegan en la Fase 3.

**Desarrollo (Axel)**

| ID    | Tarea                               | Quién          | Detalle                                                                                                                                                                                                                                                                                             |
| ----- | ----------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2-01 | Cotizador del carrito               | **A**          | El carrito vive en el navegador. `POST /api/cart/quote` recibe los ítems (id de producto y variante + cantidad) y devuelve precios, subtotal, delivery y total **calculados desde Supabase**. Nunca se confía en los precios que envía el navegador.                                                |
| F2-02 | Sedes y zonas                       | **A**          | Tablas `Branch` (Lince, Jesús María: dirección, horario, teléfono, WhatsApp) y `DeliveryZone` (distrito, tarifa, tiempo estimado, mínimo). `GET /api/branches`, `GET /api/delivery/quote?district=`. Los valores reales salen de las preguntas a la dueña; mientras tanto se usa S/ 7.50 fijo.      |
| F2-03 | Horario de atención                 | **A**          | `GET /api/branches/:id/status` (abierto/cerrado, cierra a las…). Bloquea pedidos fuera de horario.                                                                                                                                                                                                  |
| F2-04 | Checkout (crear pedido)             | **A**          | `POST /api/checkout`: valida con Zod (nombre, celular, modalidad, sede, dirección solo si es delivery), recalcula el total en el servidor y crea `orders` + `order_items` en Supabase en una sola transacción (función RPC de Postgres) con estado `pending`. Devuelve `orderId` + `trackingToken`. |
| F2-05 | Pedido programado                   | **A**          | Campo de fecha y hora deseada, validado contra el horario.                                                                                                                                                                                                                                          |
| F2-06 | Estado del carrito (cliente)        | **A** 🔗 F2-01 | Store Zustand persistido en `localStorage` (con try/catch). Respuesta inmediata (< 300 ms) y luego sincroniza el total con `/api/cart/quote`; avisa si un precio cambió o un plato se agotó.                                                                                                        |
| F2-07 | Selector de modalidad y sede        | **A** 🔗 F2-02 | En el header y al iniciar el pedido: Delivery / Recojo Lince / Recojo Jesús María. Muestra tarifa, tiempo y mínimo, y se recuerda en la sesión.                                                                                                                                                     |
| F2-08 | Carrito lateral y página de carrito | **A**          | Edición de cantidad, notas por plato, sugerencias (bebidas y postres), barra “te faltan S/ X para…”, botones de 44 px como mínimo.                                                                                                                                                                  |
| F2-09 | Animación “añadir al carrito”       | **A**          | El plato vuela al ícono del carrito, el contador rebota y el celular vibra (si está disponible).                                                                                                                                                                                                    |
| F2-10 | Checkout UI                         | **A** 🔗 F2-04 | Una página en 3 bloques (Contacto · Entrega · Pago). Validación en línea con los mismos esquemas Zod. La dirección se oculta en recojo. Resumen fijo con el total. Errores claros en español.                                                                                                       |
| F2-14 | Turnstile en el checkout            | **A**          | Widget de Turnstile (modo invisible o _managed_, accesible y en español) en el checkout y verificación del token en `POST /api/checkout` antes de crear el pedido. Se rechazan los tokens inválidos o repetidos.                                                                                    |
| F2-15 | Límite de peticiones                | **A**          | Límite por IP y por celular en `/api/checkout` y `/api/cart/quote` (por ejemplo, 10 pedidos cada 10 min por IP), con respuesta 429 y mensaje claro.                                                                                                                                                 |
| F2-11 | Pedido por WhatsApp                 | **A**          | Botón que envía el **carrito completo** a la sede elegida, con el número de WhatsApp de cada sede.                                                                                                                                                                                                  |
| F2-12 | Pantalla de pedido recibido         | **A**          | Número de pedido, resumen, tiempo estimado y enlace de seguimiento.                                                                                                                                                                                                                                 |
| F2-13 | E2E de compra (efectivo)            | **R**          | Playwright: carta → añadir 2 platos con variante → recojo en Jesús María → checkout → pedido creado en Supabase con el total correcto.                                                                                                                                                              |

**QA (Rafael)**

| ID    | Tarea de QA               | Quién | Detalle                                                                                                                                                  |
| ----- | ------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2-Q1 | Casos límite del checkout | **R** | Recojo sin dirección, cambio de sede a mitad del pedido, carrito vacío, plato agotado, pedido fuera de horario y pedido programado en una hora inválida. |
| F2-Q2 | Precios manipulados       | **R** | Alterar precios y cantidades desde el navegador (DevTools) y confirmar que el servidor recalcula el total y no acepta lo enviado por el cliente.         |
| F2-Q3 | Antibots y límites        | **R** | Turnstile con las claves de prueba (aprueba y rechaza) y superar el límite de peticiones: debe responder 429 con un mensaje claro.                       |
| F2-Q4 | Prueba con usuarios       | **R** | 3 personas (una mayor de 60) arman un pedido sin ayuda. Medir tiempo y errores: la meta es menos de 3 minutos.                                           |
| F2-Q5 | Casos de la Fase 3        | **R** | Escribir `docs/qa/fase-3.md` (pagos, webhook, seguimiento, panel, correos).                                                                              |

**Entregables:** flujo completo de pedido con pago contra entrega, guardando pedidos en Supabase.
**Criterios de aceptación:**

- Un usuario nuevo completa el pedido en menos de 3 minutos.
- El recojo no pide dirección.
- El total del servidor coincide siempre con el de la pantalla.
- No se puede pedir fuera de horario.

---

### Fase 3 · Pagos y seguimiento (semanas 9-11)

**Objetivo:** pagar con Yape, Plin y tarjeta (en **sandbox**) sin capturas de pantalla, y seguir el pedido.

**Desarrollo (Axel)**

| ID    | Tarea                     | Quién                | Detalle                                                                                                                                                                                                                                                                                                             |
| ----- | ------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F3-01 | Adaptador de pasarela     | **A**                | `lib/payments/` con una interfaz única (`createCharge`, `createYapeCharge`, `verifyWebhook`) para poder cambiar de proveedor. Solo claves de prueba.                                                                                                                                                                |
| F3-02 | Endpoint de pago          | **A**                | `POST /api/payments` con `orderId` + medio + token del front. El monto **siempre** se toma del pedido en el servidor. Idempotencia por `orderId`.                                                                                                                                                                   |
| F3-03 | Webhook                   | **A**                | `POST /api/payments/webhook`: verificación de firma, marca el pedido como `paid` en `orders` y registra el evento en `payment_events` (idempotente si llega dos veces).                                                                                                                                             |
| F3-04 | Seguimiento               | **A**                | `GET /api/orders/:trackingToken` y `PATCH /api/admin/orders/:id/status` (Recibido → En cocina → En camino/Listo para recoger → Entregado).                                                                                                                                                                          |
| F3-05 | Correos con Resend        | **A** 🔗 F3-15       | `lib/email/` con Resend: confirmación de pedido, pago aprobado y cambios de estado. Se registra cada envío (`email_log`: id de Resend, estado, reintentos). Webhook de Resend para rebotes. **Reenvío**: botón “Reenviar confirmación” en el panel y en la pantalla de seguimiento, limitado a 3 envíos por pedido. |
| F3-15 | Plantillas de correo      | **A**                | Plantillas con React Email y la identidad de Berypez (logo, colores, tipografía), legibles en celular y en modo oscuro: pedido recibido, pago aprobado, pedido en camino o listo para recoger, y entregado.                                                                                                         |
| F3-06 | Auth del panel            | **A**                | Supabase Auth (correo + contraseña o enlace mágico) con roles `admin` y `cocina` en `staff_roles`. Políticas RLS por rol y por sede.                                                                                                                                                                                |
| F3-14 | Tiempo real               | **A**                | Supabase Realtime en `orders`: el panel recibe los pedidos nuevos al instante y el cliente ve los cambios de estado de **su** pedido (filtrado por `trackingToken`).                                                                                                                                                |
| F3-07 | Selector de medio de pago | **A** 🔗 F3-02       | Logos y nombres visibles: Yape · Plin · Tarjeta · Efectivo al recibir. Se muestra **solo después** de validar los datos y con el total final.                                                                                                                                                                       |
| F3-08 | UI de Yape/Plin           | **A**                | Ingreso de celular y código de aprobación (o QR dinámico, según la pasarela), con estados de espera, éxito y error.                                                                                                                                                                                                 |
| F3-09 | UI de tarjeta             | **A**                | Formulario seguro embebido de la pasarela (tokenización en el navegador), estilizado con los tokens de diseño.                                                                                                                                                                                                      |
| F3-10 | Pantallas de resultado    | **A**                | Éxito (check animado con confeti discreto) y error con mensaje claro y opción de reintentar u otro medio. Sin `alert()`.                                                                                                                                                                                            |
| F3-11 | Página de seguimiento     | **A** 🔗 F3-04/F3-14 | Línea de tiempo animada que se actualiza sola (Realtime) y botón de WhatsApp a la sede.                                                                                                                                                                                                                             |
| F3-12 | Panel del restaurante     | **A** 🔗 F3-04/F3-06 | Lista de pedidos en vivo con sonido, filtros por sede y estado, y botones para avanzar de estado. Usable en tablet.                                                                                                                                                                                                 |
| F3-13 | E2E de pago               | **R**                | Playwright con las tarjetas y Yape de prueba: pago exitoso, pago rechazado y webhook que cambia el estado.                                                                                                                                                                                                          |

**QA (Rafael)**

| ID    | Tarea de QA         | Quién | Detalle                                                                                                                                                                           |
| ----- | ------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F3-Q1 | Pagos de prueba     | **R** | Tarjetas de prueba de la pasarela (aprobada, rechazada, 3-D Secure) y Yape/Plin de prueba. Verificar que el monto cobrado sea igual al total del pedido.                          |
| F3-Q2 | Webhook             | **R** | Enviar un webhook con firma inválida (debe rechazarse), el mismo webhook dos veces (no debe duplicar) y un webhook que llega tarde.                                               |
| F3-Q3 | Correos             | **R** | Llegada a Gmail, Outlook y Hotmail, plantillas en celular y en modo oscuro, y el botón “Reenviar confirmación” con su límite de 3 envíos.                                         |
| F3-Q4 | Panel y tiempo real | **R** | Panel en tablet: un pedido nuevo aparece al instante y suena, el cambio de estado se refleja en el seguimiento del cliente, y un usuario `cocina` no ve lo que no le corresponde. |
| F3-Q5 | Casos de la Fase 4  | **R** | Escribir `docs/qa/fase-4.md` (reservas, reclamos, legales, cookies).                                                                                                              |

**Entregables:** pago en línea funcionando en sandbox, seguimiento del pedido y panel mínimo.
**Criterios de aceptación:**

- 0 % de pagos requieren revisión manual.
- El monto cobrado siempre es igual al total del pedido.
- Un pago rechazado no crea un pedido “pagado”.
- El webhook está protegido por firma.

---

### Fase 4 · Reservas y legal (semanas 12-13)

**Objetivo:** reservas pensadas para restaurante y cumplimiento legal básico.

**Desarrollo (Axel)**

| ID    | Tarea                           | Quién          | Detalle                                                                                                                                                                                                                                             |
| ----- | ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4-01 | API de reservas                 | **A**          | `GET /api/reservations/availability?branch=&date=` (franjas de 30 min según horario y aforo), `POST /api/reservations`, `PATCH /api/reservations/:id` (cancelar o reprogramar con token).                                                           |
| F4-02 | Reglas de aforo                 | **A**          | Capacidad por franja y sede, bloqueos de fechas y límite de personas por reserva.                                                                                                                                                                   |
| F4-03 | Confirmación y recordatorio     | **A**          | Correo de confirmación por **Resend** y enlace de WhatsApp al reservar, recordatorio 2 h antes (cron de Vercel + envío programado de Resend) y opción de reenviar la confirmación.                                                                  |
| F4-04 | Libro de Reclamaciones          | **A**          | `POST /api/complaints` con Turnstile y límite de peticiones: número correlativo, almacenamiento, **constancia por correo vía Resend** (copia al correo oficial del restaurante) y datos del proveedor (RUC y razón social, pendientes de la dueña). |
| F4-05 | Formulario de reserva           | **A** 🔗 F4-01 | Una sola pantalla con sede, calendario, franjas, personas (selector), zona, ocasión, nombre, celular y correo opcional. Turnstile integrado. Confirmación animada.                                                                                  |
| F4-10 | Plantillas de reserva y reclamo | **A**          | Correos con React Email: reserva confirmada, recordatorio, reserva cancelada y constancia del Libro de Reclamaciones.                                                                                                                               |
| F4-06 | Reservas en el panel            | **A** 🔗 F4-01 | Lista del día por sede con estados: confirmada, llegó, no vino.                                                                                                                                                                                     |
| F4-07 | Páginas legales                 | **A**          | Términos y condiciones, privacidad (Ley 29733), devoluciones adaptadas a alimentos y Libro de Reclamaciones (formulario).                                                                                                                           |
| F4-08 | Aviso de cookies                | **A**          | Banner de consentimiento. GA4 y los píxeles solo cargan si el usuario acepta.                                                                                                                                                                       |
| F4-09 | E2E de reserva y reclamo        | **R**          | Reservar → recibir confirmación → cancelar con el enlace. Enviar un reclamo → recibir constancia.                                                                                                                                                   |

**QA (Rafael)**

| ID    | Tarea de QA              | Quién | Detalle                                                                                                                                        |
| ----- | ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| F4-Q1 | Aforo                    | **R** | Intentar reservar sobre el aforo, en fechas bloqueadas, fuera de horario y con más personas que el límite.                                     |
| F4-Q2 | Seguridad de datos (RLS) | **R** | Con la clave pública (anon), intentar leer pedidos, reservas y reclamos ajenos. Todo debe fallar.                                              |
| F4-Q3 | Cookies y analítica      | **R** | Confirmar en la pestaña de red que GA4 y los píxeles no cargan antes de aceptar las cookies.                                                   |
| F4-Q4 | Legales                  | **R** | Revisar que los enlaces legales funcionen desde el checkout y el pie de página, y que el reclamo genere un número y una constancia por correo. |

**Entregables:** reservas operativas y legales completas.
**Criterios de aceptación:**

- No se puede reservar sobre el aforo.
- Cada reclamo genera una constancia con número.
- Sin cookies de analítica antes del consentimiento.

---

### Fase 5 · Calidad, demo y entrega (semana 14)

**Objetivo:** dejar el MVP pulido, medido y listo para presentarlo a la dueña.

**Desarrollo (Axel)**

| ID    | Tarea                      | Quién     | Detalle                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F5-01 | Auditoría de accesibilidad | **R** → A | Rafael audita WCAG 2.2 AA (contraste, foco, lectores de pantalla, tamaño A+/A−) y hace pruebas con al menos 3 personas de distintas edades, incluida una mayor de 60. Axel corrige lo reportado.                                                                                                                                                                              |
| F5-02 | Rendimiento visual         | **A**     | LCP, CLS e INP; carga diferida de secciones; peso de fuentes.                                                                                                                                                                                                                                                                                                                 |
| F5-03 | Rendimiento de backend     | **A**     | Caché de API y tiempos de respuesta < 400 ms. La prueba de carga la hace Rafael (F5-Q2).                                                                                                                                                                                                                                                                                      |
| F5-04 | Revisión de seguridad      | **A**     | Cabeceras (CSP con los dominios de Turnstile, Supabase y la pasarela; HSTS), rate limiting en `/api/checkout`, `/api/payments`, `/api/complaints`, `/api/reservations` y el login, validación de entradas, secretos y dependencias (`npm audit`). Revisar y ajustar el firewall y Bot Management de Vercel. Probar Turnstile con las claves de prueba (aprobado y rechazado). |
| F5-10 | Entregabilidad de correos  | **R**     | Revisar en Resend la tasa de entrega y los rebotes. Probar con Gmail, Outlook y Hotmail que llegan a la bandeja de entrada. Axel activa DMARC en modo `quarantine` cuando todo esté verificado.                                                                                                                                                                               |
| F5-05 | Analítica                  | **A**     | Embudo GA4: ver plato → añadir → checkout → pago. Eventos en la UI y configuración de GA4 con consentimiento.                                                                                                                                                                                                                                                                 |
| F5-06 | Datos de demo              | **A**     | `supabase/seed.sql` con pedidos y reservas de ejemplo en `berypez-demo`, más un script para resetear la demo antes de cada presentación.                                                                                                                                                                                                                                      |
| F5-07 | Guion de demo              | **A+R**   | Recorrido de 10 minutos para la dueña: portada → carta → pedido con Yape de prueba → seguimiento → panel → reserva.                                                                                                                                                                                                                                                           |
| F5-08 | Documentación              | **A**     | `docs/design-system.md`, guía de uso del panel, `docs/api.md`, despliegue, variables de entorno y runbook.                                                                                                                                                                                                                                                                    |
| F5-09 | Regresión completa         | **R**     | Toda la suite E2E en móvil y escritorio (Chrome, Safari y Firefox), más la checklist manual de regresión. Confirma cobertura ≥ 80 %.                                                                                                                                                                                                                                          |

**QA (Rafael)**

| ID    | Tarea de QA         | Quién | Detalle                                                                                                                                                                           |
| ----- | ------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F5-Q1 | Seguridad básica    | **R** | Checklist OWASP de la app: cabeceras, entradas maliciosas en formularios (XSS, textos muy largos), acceso a `/panel` sin sesión, secretos visibles en el navegador y `npm audit`. |
| F5-Q2 | Prueba de carga     | **R** | k6 con 200 usuarios simultáneos sobre carta, cotizador y checkout. Reportar tiempos y errores para que Axel optimice (F5-03).                                                     |
| F5-Q3 | Informe final de QA | **R** | `docs/qa/informe-final.md`: casos ejecutados, bugs abiertos y cerrados por severidad, métricas de Lighthouse antes y después, y recomendación de “listo / no listo” para la demo. |

**Entregables:** MVP en un enlace estable de Vercel, informe de métricas (Lighthouse antes y después), guion de demo y documentación.
**Criterios de aceptación:**

- Lighthouse móvil: rendimiento ≥ 90, accesibilidad 100, SEO 100 y buenas prácticas 100.
- Los 5 flujos E2E en verde.

---

## 6. Resumen de responsabilidades

| Fase                      | Axel (desarrollo)                                                                                                                                                                         | Rafael (QA / pruebas)                                                                                                      | Juntos                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **0** Preparación         | Repo, CI, cuentas (Supabase, Vercel, Turnstile, Resend), importación y limpieza del catálogo, esquema + RLS, contrato, pasarela, sistema de diseño, componentes, prototipo, layout, mocks | Plan de pruebas, Playwright en la CI, casos de la Fase 1, revisión del catálogo importado, QA del prototipo                | Revisar el prototipo      |
| **1** Carta + portada     | Datos y API de catálogo, búsqueda, etiquetas, imágenes, SEO, portada, carta, vista rápida, filtros, animaciones                                                                           | E2E de carta, QA manual, accesibilidad, Lighthouse, exactitud de datos                                                     | Demo de avance a la dueña |
| **2** Carrito + checkout  | Cotizador, sedes y zonas, horario, pedido (RPC), Turnstile, límite de peticiones, carrito, checkout, WhatsApp                                                                             | E2E de compra, casos límite, precios manipulados, antibots y límites, prueba con usuarios                                  | —                         |
| **3** Pagos + seguimiento | Pasarela, webhook, seguimiento, Realtime, auth del panel, correos (Resend + plantillas), UI de pago y panel                                                                               | E2E de pago, pagos de prueba, webhook, correos, panel en tablet                                                            | —                         |
| **4** Reservas + legal    | Reservas, aforo, recordatorios, Libro de Reclamaciones, legales, cookies                                                                                                                  | E2E de reserva y reclamo, aforo, RLS, cookies, legales                                                                     | —                         |
| **5** Calidad + demo      | Correcciones, rendimiento, seguridad, analítica, datos de demo, documentación                                                                                                             | Auditoría de accesibilidad con usuarios, seguridad básica, carga (k6), entregabilidad de correos, regresión, informe final | Guion y ensayo de la demo |

**Cronograma estimado: 14 semanas**

Con un solo desarrollador ya no hay trabajo en paralelo entre frontend y backend, así que el plan pasa de 9 a ~14 semanas. Rafael trabaja **en paralelo** a Axel: prepara los casos y los E2E de cada fase mientras Axel la construye, así la Fase 5 no se alarga.

```
Semana      1   2   3   4   5   6   7   8   9  10  11  12  13  14
Fase 0     ███ ███
Fase 1             ███ ███ ███
Fase 2                         ███ ███ ███
Fase 3                                     ███ ███ ███
Fase 4                                                 ███ ███
Fase 5                                                         ███
QA Rafael  ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ███
Demo a la dueña:  fin F1 (semana 5, avance) · fin F5 (semana 14, MVP completo)
```

---

## 7. Definition of Done (todas las fases)

Una tarea está terminada cuando cumple todo lo siguiente:

- [ ] Axel escribió los tests unitarios primero, todos pasan y la cobertura es ≥ 80 % en el código nuevo.
- [ ] Lint, typecheck y build en verde en la CI.
- [ ] Rafael revisó el PR, lo probó en el preview de Vercel según los casos de la fase y lo aprobó.
- [ ] Los E2E del flujo afectado pasan y no hay bugs `crítico` ni `alto` abiertos.
- [ ] Funciona en móvil (375 px) y escritorio (1440 px).
- [ ] Es accesible: navegación con teclado, foco visible, textos en español y contraste AA.
- [ ] Sin `console.log`, sin secretos en el código y con errores manejados y mensajes claros.
- [ ] Si cambió el contrato de la API, se actualizaron `docs/api.md` y `src/types`.
- [ ] Se puede ver en el preview de Vercel.

---

## 8. Riesgos

| Riesgo                                                                                                     | Mitigación                                                                                                                                                                                                 | Dueño |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Demora en la cuenta sandbox de la pasarela                                                                 | Pedirla en la Fase 0. Mientras tanto, usar un adaptador “mock” con la misma interfaz.                                                                                                                      | A     |
| Datos reales (horarios, zonas, RUC) aún desconocidos                                                       | Usar valores configurables en la BD y llenarlos tras la entrevista con la dueña.                                                                                                                           | A     |
| Fotos de calidad dispar                                                                                    | Usar las fotos actuales optimizadas y proponer una sesión fotográfica en la demo.                                                                                                                          | A     |
| Un solo desarrollador (cuello de botella en Axel)                                                          | Fases cortas con demo al final, mocks para avanzar la UI sin esperar al backend, Rafael adelanta los casos y los E2E, y si hay retraso se recorta alcance de la Fase 4 o 5 antes que la calidad.           | A     |
| Bugs detectados tarde                                                                                      | Rafael prueba cada PR (no solo al final), los E2E corren en la CI y se definen severidades: lo `crítico` bloquea el merge.                                                                                 | R     |
| Tocar producción por error                                                                                 | `berypez.pe` solo se usa en `import-catalog.ts`, que únicamente hace GET. Ningún otro código conoce esa URL.                                                                                               | A     |
| Exponer datos por RLS mal configurado                                                                      | RLS activado en todas las tablas, tests de políticas (anon no puede leer pedidos ajenos) y `service_role` solo en el servidor.                                                                             | A     |
| Límites del plan gratuito de Supabase (pausa por inactividad, almacenamiento)                              | Usar `berypez-demo` con actividad semanal; pasar a Pro (US$ 25/mes) solo si la dueña aprueba el proyecto.                                                                                                  | A     |
| Correos en spam o sin dominio verificado (sin dominio, Resend solo envía al correo del dueño de la cuenta) | Verificar el dominio en la Fase 0 (SPF, DKIM y DMARC en el DNS del dominio) y monitorear rebotes. El plan gratuito permite 3,000 correos al mes y 100 al día; si la demo se usa mucho, pasar al plan pago. | A     |
| Turnstile bloquea a personas mayores o con conexión lenta                                                  | Modo _managed_ (solo pide un clic si duda), mensajes en español y alternativa “Pedir por WhatsApp” si falla.                                                                                               | A     |
| Si luego se decide mantener WooCommerce como sistema oficial                                               | El adaptador de catálogo y pedidos queda aislado en `lib/supabase/`; se podría reemplazar por WooCommerce sin tocar la UI.                                                                                 | A     |

---

## 9. Pendientes con la dueña

Se necesitan antes o durante la Fase 2 (ver el cuestionario que se preparará):

- Horarios reales por sede y por día.
- Zonas de reparto, tarifas, tiempos y pedido mínimo.
- RUC, razón social y correo oficial (para recibir copia de pedidos y reclamos).
- Dominio: ¿se usa un subdominio de `berypez.pe` (por ejemplo `demo.berypez.pe`) y quién administra hoy su DNS? Si no, el equipo usa un dominio propio para la demo. Resend necesita un dominio verificado para enviar correos a clientes.
- Pasarela preferida o cuentas existentes (Yape Empresas, bancos).
- Aforo por sede y política de reservas.
- Platos estrella, combos y promociones.
- Fotos y logo en alta calidad.

---

## 10. Cómo arrancar

Requisitos: **Node 22** y npm.

```bash
# 1. Instalar dependencias (también activa los hooks de Husky)
npm install

# 2. Variables de entorno
cp .env.example .env.local
#    Pedir a Axel las claves de berypez-dev. La clave secreta (sb_secret_…) nunca se sube al repo.
#    Las claves de Turnstile del ejemplo son las de prueba de Cloudflare.

# 3. Desarrollo
npm run dev              # http://localhost:3000
```

**Scripts disponibles**

| Comando                                     | Qué hace                                                   |
| ------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                               | Servidor de desarrollo.                                    |
| `npm run build` / `npm start`               | Build de producción y servidor.                            |
| `npm run lint`                              | ESLint (reglas de Next.js + TypeScript).                   |
| `npm run typecheck`                         | TypeScript estricto (`noUncheckedIndexedAccess`).          |
| `npm run format` / `format:check`           | Prettier (con orden de clases de Tailwind).                |
| `npm test` / `test:watch` / `test:coverage` | Vitest + Testing Library. La cobertura mínima es del 80 %. |
| `npm run check`                             | Todo lo anterior junto (lo mismo que corre la CI).         |
| `npm run catalog:fetch`                     | Única lectura del catálogo de berypez.pe → `data/catalog`. |
| `npm run catalog:images` / `catalog:build`  | Fotos WebP y catálogo normalizado (sin tocar producción).  |

Los tests de `tests/db/` aplican las migraciones de `supabase/migrations` en un Postgres en memoria (PGlite, sin Docker) y comprueban las políticas RLS y las reglas de datos.

Antes de cada commit, Husky ejecuta `lint-staged` (ESLint + Prettier sobre los archivos modificados).

**Supabase (berypez-dev)**

Los scripts usan la Management API de Supabase: no necesitan Docker ni la contraseña de la base. Requieren en `.env.local` el token personal `SUPABASE_ACCESS_TOKEN` (supabase.com/dashboard/account/tokens) y, para cargar datos, `SUPABASE_SECRET_KEY`.

```bash
npm run db:push -- --dry   # muestra las migraciones pendientes
npm run db:push            # aplica las pendientes y las registra en el historial
npm run db:types           # regenera src/types/database.ts
npm run catalog:load       # sube fotos a Storage y carga el catálogo (idempotente)
```

**Vercel (proyecto `berypez-project`)**

Cada push a una rama genera un preview protegido con Vercel Authentication: hay que ser miembro del equipo o usar un enlace para compartir. Las variables ya están cargadas (`SUPABASE_SECRET_KEY` y `TURNSTILE_SECRET_KEY` como _sensitive_). Para usar la CLI:

```bash
npx vercel link
npx vercel env pull .env.local
```

### Estado de la Fase 0

| ID                         | Tarea                                                                                                                                                                                                                         | Estado                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| F0-01                      | Proyecto base (Next.js 15.5, TS estricto, Tailwind 4, ESLint, Prettier, Husky, Vitest, `.env.example`, validación de variables de entorno con Zod)                                                                            | ✅ Hecho                                         |
| F0-02                      | CI en GitHub Actions (lint, tipos, formato, tests con cobertura, build; Lighthouse informativo)                                                                                                                               | ✅ Hecho (se activa al subir el repo a GitHub)   |
| F0-03                      | Supabase `berypez-dev` conectado (clientes, claves publishable/secret, scripts `db:*`). Vercel pendiente                                                                                                                      | 🚧 Supabase ✅ · Vercel ⏳                       |
| F0-04                      | Catálogo: snapshot único de berypez.pe, 107 productos limpios (Anexo B), mapeo a 6 cartas y 106 fotos WebP, cargados en Supabase y Storage                                                                                    | ✅ Hecho (F0-Q4 de Rafael)                       |
| F0-05                      | Contrato de datos v1 (`src/types/catalog.ts`) y `docs/api.md`                                                                                                                                                                 | ✅ Hecho (revisión de Rafael)                    |
| F0-06                      | Esquema SQL (catálogo, sedes, zonas, pedidos, pagos, reservas, reclamos, personal) con RLS en todas las tablas, aplicado en Supabase, sin avisos del advisor                                                                  | ✅ Hecho                                         |
| F0-08                      | Sistema de diseño: tokens en `src/styles/tokens.css` (paleta con contraste medido, Fraunces + Inter, base 18 px, objetivos táctiles de 48 px) y `docs/design-system.md`                                                       | ✅ Hecho                                         |
| F0-12                      | Layout global: SkipLink, header con selector de modalidad/sede y carrito, footer con ola, legales y medios de pago, barra inferior móvil                                                                                      | ✅ Hecho (datos de sedes pendientes de la dueña) |
| F0-09                      | Componentes base accesibles: Button, IconButton, Chip, Badge, Card, Dialog (hoja, modal, panel lateral) sobre `<dialog>` nativo, Input, Select, Stepper, Skeleton y Toast (Sonner). Vitrina en `/componentes` (solo previews) | ✅ Hecho                                         |
| F0-07                      | Pasarela: Mercado Pago para el sandbox del MVP (Yape con casos de prueba públicos), Plin con adaptador mock; producción Izipay o Culqi según cotización. Ver `docs/decisiones/0001-pasarela-de-pagos.md`                      | ✅ Decidido (falta crear la cuenta de prueba)    |
| F0-10, F0-11, F0-13, F0-14 | Resto de la fase                                                                                                                                                                                                              | ⏳ Pendiente                                     |

> **Nota de dependencias:** `npm audit` reporta una vulnerabilidad de PostCSS **incluida dentro de Next 15**. Solo afecta al procesamiento de nuestro propio CSS en el build (no a datos de usuarios) y únicamente se corrige migrando a Next 16. Queda registrada para evaluarla en la Fase 5 (F5-04).
