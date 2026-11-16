# Verificación de las correcciones de Axel (QA-001 a QA-009)

**Responsable:** Rafael (QA) · **Fecha:** 2026-11-16 · **Rama revisada:** `develop` (`8dfc63a`), build de producción local con el catálogo del snapshot.

Método: para cada hallazgo no basta con que pasen las pruebas de Axel. Se verificó de forma independiente y se agregó una
prueba propia que lo vigila para que no vuelva.

## Resultado

| Issue      | Hallazgo                                         | Corrección de Axel                                                                                            | Verificación de QA                                                                                                                                                                                                                 | Prueba que lo vigila                                         |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| #23 QA-001 | «Sin picante» no filtraba nada                   | El filtro solo aparece si de verdad separa los platos (`availableFilters`); no se etiquetaron platos picantes | ✅ En las 6 cartas, móvil y escritorio: **todo filtro visible deja entre 1 y N-1 platos**; no queda un grupo de filtros vacío                                                                                                      | `filtros-utiles.spec.ts`                                     |
| #28 QA-005 | El error de un campo escrito no se mostraba      | `field-errors.ts` ignora el texto vacío                                                                       | ✅ Checkout: nombre, celular, correo y dirección muestran su error y se limpian al corregir. ✅ Libro de Reclamaciones: igual                                                                                                      | `checkout-validacion.spec.ts`, `reclamos-validacion.spec.ts` |
| #36 QA-009 | Las páginas se pintaban con el loader y saltaban | Se quitó `loading.tsx`; el aviso lo da `NavigationLoader`                                                     | ✅ El HTML ya no trae el loader en 5 rutas. **CLS en celular 0.160 → 0.000-0.010**; carta Marina en escritorio 0.0004. ✅ Con red lenta el velo «Abriendo la página» sigue apareciendo y se retira; con red rápida no hay destello | `carga-inicial.spec.ts`, `navegacion-aviso.spec.ts`          |
| #29 QA-006 | La carta Marina tenía 1 219 nodos                | Tarjetas más livianas (`data-producto`)                                                                       | ✅ **957 nodos** (límite 1 000). Las otras cartas: 387 a 575                                                                                                                                                                       | `rendimiento.spec.ts`                                        |
| #24 QA-002 | Dos platos «Arroz con mariscos»                  | El de la sección Fuentes ahora es «Fuente de arroz con mariscos»                                              | ✅ La prueba de integridad del catálogo ya no encuentra nombres repetidos                                                                                                                                                          | `catalog-integridad.test.ts`                                 |
| #30 QA-007 | Detalles menores                                 | Enlace «Más información sobre cookies»; sin `browsing-topics`; el aviso ya no tapa el pie                     | ✅ Los tres puntos. En celular, sin decidir las cookies, se puede tocar «Política de privacidad» del pie                                                                                                                           | `cookies.spec.ts` (bloque QA-007)                            |

## Abiertos

| Issue      | Estado                               | De qué depende                                                                              |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| #25 QA-003 | «Dúo vegetariano» sin foto           | La foto de la dueña                                                                         |
| #26 QA-004 | Alérgenos y porciones vacíos (F1-04) | Los datos de la dueña. De paso, «Sin picante» aparecerá solo cuando se etiqueten los platos |
| #33 QA-008 | Botones sobre el video de la portada | Decisión de Axel y la dueña (botón de pausa por WCAG 2.2.2)                                 |

## Observaciones nuevas (no son bugs)

- **Margen en el DOM de la carta Marina:** 957 de 1 000. Si se agregan unos 40 nodos (por ejemplo más platos o etiquetas), vuelve a pasarse.
- **CLS residual en la portada de escritorio:** 0.024-0.030 constante (límite 0.1). Muy bueno, pero no es cero; vale revisarlo en la auditoría de la Fase 5.
- **Filtros y datos:** al ocultar los filtros que no separan platos, hoy no hay filtro de picante, de niños ni de compartir en varias cartas. No es un error, pero la oferta de filtros crecerá solo cuando se etiqueten los platos (F1-04).

## Publicación y permisos (qué se comprobó)

- Permiso de `RafaelCly` en el repositorio: **write**. `main` no tiene reglas de protección (el plan gratuito de GitHub no las ofrece en repos privados).
- Existe `.github/workflows/publicar.yml`: tras pasar la CI en `main` (producción) o `develop` (preview) publica con la CLI de Vercel usando el secreto
  `VERCEL_TOKEN` del dueño. La integración de Git de Vercel está apagada, así que **quien fusiona ya no depende de ser miembro del equipo de Vercel**.
- Las últimas publicaciones a `main` salieron en verde.
