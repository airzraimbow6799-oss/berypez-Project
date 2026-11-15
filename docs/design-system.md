# Sistema de diseño · Berypez

Concepto: **cevichería de barrio con 14 años de cariño**. La foto del plato es la protagonista. La interfaz es sobria y cálida, y el mar aparece en un solo gesto: el borde en ola del pie de página.

Fuente de verdad: `src/styles/tokens.css` (bloque `@theme` de Tailwind 4). Cada token genera su clase: `bg-aji`, `text-marino`, `rounded-pill`, `shadow-md`, `min-h-tactil`, etc. No uses valores de color o tamaño sueltos en los componentes.

## Color

| Token                     | Hex                   | Uso                                                                                |
| ------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `marino`                  | `#082F49`             | Texto principal, barra superior, pie de página.                                    |
| `aji`                     | `#F2B33D`             | Acción de compra (“Pedir ahora”, carrito). Siempre con texto marino.               |
| `rocoto` / `rocoto-texto` | `#E4572E` / `#B8401D` | Promociones. El puro solo como fondo con texto grande; para texto, `rocoto-texto`. |
| `crema`                   | `#FBF7F0`             | Fondo de página.                                                                   |
| `limon` / `limon-texto`   | `#7BB661` / `#356B23` | Etiqueta vegetariana. Para texto, `limon-texto`.                                   |
| `tinta-suave`             | `#3E5566`             | Texto secundario.                                                                  |
| `borde`                   | `#E2D8C7`             | Bordes de tarjetas y campos.                                                       |

Contraste medido sobre crema: marino 13.0:1, tinta suave 7.3:1, rocoto-texto 5.2:1 y limón-texto 6.0:1. Botón ají con texto marino: 7.5:1.

**Foco visible:** `marino-600` sobre fondos claros (7.0:1) y `aji` sobre fondos marino (clase `sobre-marino`). El ají sobre crema da 1.7:1 y no sirve como foco.

## Tipografía

- **Fraunces** (variable, eje óptico) solo para títulos y el logotipo, con moderación.
- **Inter** para todo lo demás.
- Base de **18 px**, interlineado 1.5 y escala 1.2: `text-xs` 13 · `text-sm` 15 · `text-base` 18 · `text-lg` 21 · `text-xl` 25 · `text-2xl` 30 · `text-3xl` 32–44 · `text-4xl` 40–64.

## Forma, profundidad y movimiento

- Radios: `rounded-sm` 8 px (campos) · `rounded-md` 14 px (tarjetas, paneles) · `rounded-lg` 20 px · `rounded-pill` (botones y chips).
- Sombras con tinte marino: `shadow-sm`, `shadow-md` (botón principal), `shadow-lg` (paneles flotantes).
- Duraciones de 150, 250 y 400 ms con `ease-out-suave`. Todo se desactiva con `prefers-reduced-motion`.
- Objetivo táctil mínimo: `min-h-tactil` / `size-tactil` = **48 px**.

## Layout (F0-12)

| Pieza                 | Archivo                              | Notas                                                                        |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Saltar al contenido   | `components/layout/SkipLink.tsx`     | Primer elemento enfocable.                                                   |
| Header                | `components/layout/SiteHeader.tsx`   | Barra marino, logo, menú, selector de modalidad/sede y carrito. Fijo arriba. |
| Selector de modalidad | `components/layout/ModeSelector.tsx` | Delivery / Recojo Lince / Recojo Jesús María; se recuerda en la sesión.      |
| Footer                | `components/layout/SiteFooter.tsx`   | Ola, sedes, cartas, legales y medios de pago.                                |
| Barra inferior móvil  | `components/layout/MobileNav.tsx`    | Carta · Buscar · Carrito · Reservar · WhatsApp (si hay número).              |

Los datos de las sedes viven en `src/config/site.ts`. Los que aún no confirma la dueña valen `null` y la interfaz no los muestra.

## Pendiente

- F0-09: componentes base (`Button`, `Chip`, `Badge`, `Card`, `Sheet`/`Modal`, `Drawer`, `Input`, `Select`, `Stepper`, `Skeleton`, `Toast`).
- Control A+ / A− de tamaño de letra (propuesta §14).
- Logotipo vectorial de la marca (hoy es un logotipo en texto).
