# Medición local · Fase 1 (F1-Q3) y hallazgos de la tanda sin base de datos

**Responsable:** Rafael (QA) · **Fecha:** 2026-11-15 · **Rama revisada:** `main` (`87025f4`)

> **Cómo se midió:** build de producción (`next build` + `next start`) en la computadora de QA, con el catálogo del snapshot
> (`CATALOG_SOURCE=snapshot`), sin Supabase y sin CDN. Lighthouse 12.3 en modo móvil (4G simulado, CPU ×4 más lenta).
> **Los números de rendimiento son orientativos**: hay que repetirlos en un preview de Vercel (hoy la demo
> `berypez-demo.vercel.app` está detrás del login de Vercel y QA no puede abrirla).

## 1. Lighthouse móvil

| Página          | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP   | CLS | TBT    | Criterio del README (F1)                            |
| --------------- | ----------- | ------------- | ---------------- | --- | ----- | --- | ------ | --------------------------------------------------- |
| `/`             | **64** ⚠️   | **100** ✅    | 96               | 92  | 7.2 s | 0   | 300 ms | Rendimiento ≥ 85 · Accesibilidad ≥ 95 · LCP < 2.5 s |
| `/carta/marina` | **52** ⚠️   | **100** ✅    | 96               | 85  | 7.8 s | 0   | 630 ms | ídem                                                |

- **Accesibilidad:** 100 en ambas páginas (cumple el criterio de la Fase 1 y el de la Fase 5).
- **Rendimiento y LCP:** por debajo del criterio, pero **no es concluyente**: el entorno local no tiene CDN ni caché de imágenes y la
  máquina de QA estaba con carga. Hay que medirlo en el preview de Vercel antes de reportarlo como bug.
- **CLS = 0** en ambas: no hay saltos de diseño.
- **Bloqueo de hilo (TBT) alto en la carta** (630 ms): coincide con el tamaño del DOM (ver abajo).

## 2. Nodos del DOM (M-03) · `tests/e2e/rendimiento.spec.ts`

Criterio del README: **menos de 1 000 nodos** en la carta.

| Página               | Móvil     | Escritorio | Resultado     |
| -------------------- | --------- | ---------- | ------------- |
| `/`                  | 598       | 601        | ✅            |
| `/carta/marina`      | **1 219** | **1 222**  | ❌ **QA-006** |
| `/carta/criolla`     | 697       | 698        | ✅            |
| `/carta/berycafe`    | 622       | 616        | ✅            |
| `/carta/piqueos`     | 487       | 483        | ✅            |
| `/carta/el-bar`      | 504       | 495        | ✅            |
| `/carta/vegetariana` | 423       | 419        | ✅            |

## 3. Hallazgos nuevos

### QA-005 · El error de un campo del checkout no se muestra si ya escribiste en él — severidad **alta**

- **Pasos:** `/checkout` con un plato en el carrito → escribir un celular inválido (`812345678`) → salir del campo o tocar «Confirmar pedido».
- **Esperado:** el mensaje «Ingresa un celular de 9 dígitos que empiece con 9.» junto al campo.
- **Real:** no aparece ningún mensaje en el campo. Solo sale el aviso general «Revisa los datos marcados.», sin marcar cuál. Los campos **vacíos** sí
  muestran su error; los que ya se escribieron, no. Afecta a nombre, celular, correo y dirección.
- **Causa probable:** en `src/components/checkout/CheckoutForm.tsx`, `set()` deja `serverErrors[campo] = ""` al escribir y `errorFor()` usa
  `serverErrors[field] ?? clientErrors[field]`; como `""` no es `null`, nunca se llega al error del cliente. Solución sugerida: usar `||` (o borrar la clave).
- **Por qué importa:** la validación en línea es un requisito de F2-10 y la meta es que una persona mayor complete el pedido en menos de 3 minutos sin ayuda.
- **Pruebas:** `tests/e2e/checkout-validacion.spec.ts` › bloque «validación de campos ya escritos (QA-005)» (5 pruebas, `test.fail`).

### QA-006 · La carta Marina tiene 1 219 nodos en el DOM (límite: 1 000) — severidad **media**

- **Real:** 1 219 en móvil y 1 222 en escritorio; el resto de las cartas cumple. Se relaciona con el TBT alto de la carta (630 ms).
- **Sugerencia:** cargar de forma diferida las secciones fuera de pantalla o simplificar la estructura de cada tarjeta (52 platos × ~23 nodos).
- **Prueba:** `tests/e2e/rendimiento.spec.ts` › `/carta/marina` (`test.fail`).

### QA-009 · Todas las páginas se pintan primero con el loader y luego saltan: CLS de hasta 0.5 — severidad **alta**

- **Real:** `src/app/(site)/loading.tsx` hace que **cada página pública** se sirva con el loader de los peces como contenido inicial
  (`<template id="B:0">`) y la página real dentro de un `<div hidden id="S:0">` que un script de React muestra después. Se pinta primero el
  loader (60 vh), luego el contenido lo reemplaza y el pie de página salta de ~714 px a ~3 647 px.
- **Medido** (build de producción, `next start`): CLS 0.54 en escritorio (1440 × 900) con «reducir movimiento»; **0.16 en celular (412 × 823)
  con la CPU 4× más lenta, en todas las corridas** (límite recomendado: 0.1). Verificado en `/`, `/carta/marina`, `/carta/criolla`, `/nosotros` y `/terminos`.
- **Efectos:** CLS fuera de criterio, un destello del loader en cada visita y contenido oculto (`hidden`) hasta que se ejecuta el script.
  También puede inflar el LCP, porque la foto de la portada aparece solo cuando se hace el reemplazo.
- **Sugerencia:** que las páginas estáticas no usen `loading.tsx` como fallback inicial (por ejemplo, mover el loader al `NavigationLoader`, que
  ya cubre las navegaciones lentas) o que el fallback reserve el alto real de la página.
- **Prueba:** `tests/e2e/carga-inicial.spec.ts` (5 rutas, `test.fail`): revisa el HTML crudo y falla mientras exista el `<template id="B:0">`.

### QA-007 · Detalles menores — severidad **baja**

- El enlace «Más información» del aviso de cookies no es descriptivo (Lighthouse `link-text`, baja el SEO de todas las páginas). Sugerencia: «Más información sobre cookies» o un `aria-label`.
- En el celular (375 px), el aviso de cookies de la primera visita queda fijo sobre los dos últimos enlaces legales del pie («Política de privacidad» y «Cambios y devoluciones») hasta que la persona decide. Se cierra con un toque, pero tapa enlaces legales; conviene que no los cubra.
- Chrome registra un aviso de consola por la cabecera `Permissions-Policy`: «Unrecognized feature: 'browsing-topics'». No rompe nada, pero ensucia la consola y es un punto en «Buenas prácticas» (96).

## 4. Movimiento nuevo (rama `feat/motion-ceviche`): costo medido

Comparación en la **misma build**, 10 cargas alternadas con y sin movimiento (con «reducir movimiento» el CSS nuevo queda apagado), CPU 4× más lenta, celular:

|                | Hilo bloqueado (mediana) | LCP (mediana) | CLS (media) |
| -------------- | ------------------------ | ------------- | ----------- |
| Sin movimiento | 918 ms                   | 1 552 ms      | 0.160       |
| Con movimiento | 933 ms                   | 1 544 ms      | 0.160       |

Sin diferencia. Lighthouse en esta máquina varía entre 44 y 66 puntos de rendimiento entre corridas de la misma versión, así que no sirve para comparar.

## 5. Lo que sí funciona (probado)

| Área            | Qué se verificó                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Carrito         | Vacío con mensaje y enlace a la carta; contador del encabezado; persiste al recargar y entre pestañas; sigue funcionando si `localStorage` falla; mismas variantes suman y variantes distintas son líneas aparte; cantidad y quitar.             |
| Checkout        | Enviar vacío marca los obligatorios; recojo no pide dirección; delivery exige distrito y dirección; términos obligatorios y enlazados; «Programar» muestra fecha y hora; Yape, Plin y tarjeta no están activos; HTML en el nombre no se ejecuta. |
| Cookies         | El aviso aparece en la primera visita; **no se carga Google Analytics antes de aceptar ni después de rechazar**; al aceptar se carga y se recuerda; se borra la decisión y vuelve; se decide con teclado; sin `localStorage` no rompe.           |
| Enlaces legales | El pie enlaza a las 4 páginas legales y cada una carga.                                                                                                                                                                                          |

## 6. Pendiente

- Repetir Lighthouse en un preview de Vercel (necesita que Axel quite la protección de despliegue o dé acceso a QA).
- Lo que requiere base de datos o claves: ver `fase-2.md` a `fase-4.md` (🔑).
