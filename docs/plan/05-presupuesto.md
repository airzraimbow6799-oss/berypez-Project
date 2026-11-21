# 05 · Presupuesto

> **Qué es y qué no es.** Este documento separa tres cosas: (1) lo que cuesta **mantener** la plataforma cada mes, con cifras públicas verificadas y fechadas; (2) las **horas de desarrollo**, que son estimaciones nuestras; (3) lo que cobra la **pasarela** por cada venta. **No hay tarifas de nuestro trabajo escritas aquí**: se acuerdan entre nosotros y con la dueña. Hay una tabla lista para completar.

**Fecha de las consultas de precios:** 21-nov-2026. Los planes y tarifas cambian; antes de contratar se vuelve a mirar la página oficial de cada proveedor. Las cifras en dólares se muestran en dólares (el tipo de cambio del día no está fijado aquí).

## 1. Costos mensuales de infraestructura

| Servicio                                            | Plan recomendado    | Costo                                                           | Qué cubre / por qué ese plan                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel (hosting de la web)                          | Pro                 | **US$ 20 / usuario / mes**                                      | Según su documentación, cada usuario del equipo se factura a US$ 20, incluido el primero, y el plan trae un crédito de uso. Los términos de Vercel reservan el plan gratuito (Hobby) para uso personal no comercial; un negocio debería estar en Pro (verificar en sus términos). |
| Supabase (base de datos, login, tiempo real, fotos) | Pro                 | **US$ 25 / mes por organización**                               | Incluye US$ 10 de crédito de cómputo, 8 GB de disco, 250 GB de transferencia y copias diarias con retención de 7 días. **El plan gratuito pausa los proyectos tras una semana de poca actividad**: inaceptable para un restaurante.                                               |
| Resend (correos)                                    | Gratis para empezar | **US$ 0** (hasta 3,000 correos al mes y 100 por día, 1 dominio) | Sobra para confirmaciones de pedidos y reservas de un local. Si se supera: Pro a **US$ 20 / mes** por 50,000 correos.                                                                                                                                                             |
| Cloudflare Turnstile                                | Gratis              | **US$ 0**                                                       | Anti-bots de formularios (ya en uso).                                                                                                                                                                                                                                             |
| Dominio `.pe`                                       | —                   | **≈ S/ 110-150 al año**                                         | Rango que dan registradores peruanos; en euros, los internacionales piden unos € 52-63. Ojo con «primer año gratis»: la renovación se cobra a precio normal. No hay tarifa oficial de NIC.PE en las consultas; se cotiza con el registrador elegido.                              |
| Sentry (errores), opcional                          | Gratis              | **US$ 0** (verificar límites)                                   | Solo si el equipo decide sumarlo.                                                                                                                                                                                                                                                 |

### Total mensual base

| Concepto               | US$ / mes           |
| ---------------------- | ------------------- |
| Vercel Pro (1 usuario) | 20                  |
| Supabase Pro           | 25                  |
| Resend (plan gratuito) | 0                   |
| **Total**              | **45**              |
| Total anual (45 × 12)  | **540**             |
| + dominio `.pe`        | ≈ S/ 110-150 al año |

Notas:

- **1 solo usuario de pago en Vercel** si la publicación se hace con la Action de GitHub (`publicar.yml`) y un token. Cada persona del equipo que entre al panel de Vercel y deba tener acceso cuenta como otro usuario (otros US$ 20). Una fuente de terceros menciona US$ 24 por usuario si se paga mes a mes en vez de por año; no lo pude confirmar en la página oficial.
- **Quién paga y a nombre de quién** (la dueña, o nosotros y se lo trasladamos) es una decisión comercial pendiente. Lo recomendable es que las cuentas de producción queden **a nombre del negocio** y nosotros como administradores invitados.
- Supabase cobra aparte si se pasa de lo incluido (disco, transferencia, cómputo). Con la carga de uno o dos locales no se espera, pero el panel de Supabase muestra el consumo y se revisa cada mes.
- Hoy el proyecto se publica en una cuenta de Vercel con la que Rafael no tiene acceso (#62). Antes de producción se define en qué cuenta vive.

## 2. Costos del lado de la pasarela (los paga el negocio por venta)

La pasarela **no cobra mensualidad fija conocida** en las fuentes consultadas; cobra un porcentaje por venta, y a veces un monto fijo. **Las cifras públicas no coinciden entre fuentes** (son blogs y comparadores; no hay tarifarios oficiales completos), así que se usan solo como rango de referencia.

| Proveedor       | Referencia pública (sin confirmar)                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Culqi           | Tarjeta ≈ 3.5 % + IGV según una comparativa; otro agregador da 3.99 % + US$ 0.20 + IGV para tarjetas internacionales; Yape entre 2.99 % y 3.99 % según el plan, aunque otro agregador da 3.44 % + IGV. Tiene un tarifario oficial (abril 2026) cuyas cifras no pude leer. |
| Izipay / Niubiz | Rangos entre ≈ 3.29 % y 3.99 % + IGV (Izipay) y 3.45 %-4.19 % + IGV (Niubiz); otra fuente da 3.44 % + IGV para tarjetas peruanas y 3.95 % para extranjeras. Costo de instalación: una fuente dice hasta S/ 200 según el plan, otra dice que la afiliación es gratis.      |
| Mercado Pago    | Una guía da 4.49 % + IGV (crédito, 1 cuota) y 3.49 % + IGV (débito) con abono en 14 días; otra, 3.99 %-4.99 % + IGV. El ADR 0001 cita ≈ 3.29-3.49 % + S/ 1.00 + IGV.                                                                                                      |

**Ejemplo de cuenta (ilustrativo):** un pedido de S/ 100 con una comisión de 3.5 % + IGV cuesta 3.5 × 1.18 = **S/ 4.13** al negocio. Con el rango 3.29 %-3.99 % sería de S/ 3.88 a S/ 4.71, más un monto fijo por operación si el proveedor lo aplica. Es el motivo por el que la **cotización escrita** (con plazo de abono y contracargos) se pide antes de decidir.

## 3. Horas de desarrollo

1 día-persona = 8 horas. Las estimaciones son **nuestras** y llevan ±30 % de margen (ver [03-plan-de-trabajo.md](03-plan-de-trabajo.md)).

| Módulo                                                            | Días   | Horas   |
| ----------------------------------------------------------------- | ------ | ------- |
| Cimientos, QA global, manual y puesta en producción (transversal) | 9      | 72      |
| 1 · Login y roles                                                 | 4      | 32      |
| 2 · Panel admin de la carta                                       | 6      | 48      |
| 3 · Reservas centralizadas                                        | 9.5    | 76      |
| 4 · Notificaciones en tiempo real                                 | 3.5    | 28      |
| 5 · Pasarela de pagos (hasta producción)                          | 15     | 120     |
| 6 · Dashboard                                                     | 6      | 48      |
| **Total**                                                         | **53** | **424** |

### Plantilla para calcular el costo de desarrollo

```
Costo de desarrollo = horas × tarifa por hora acordada
Recomendado: sumar 15 %-20 % de imprevistos (cambios pedidos tras la reunión 1, errores de integración).
```

| Persona               | Horas | Tarifa / hora | Subtotal     |
| --------------------- | ----- | ------------- | ------------ |
| Axel                  | 226   | _a definir_   | 226 × tarifa |
| Rafael                | 198   | _a definir_   | 198 × tarifa |
| Imprevistos (15-20 %) |       |               | _a definir_  |

(Las horas de cada uno salen de 28.25 y 24.75 días × 8.)

## 4. Opciones para que la dueña elija (por escalones)

Cada escalón **suma** al anterior. Los días incluyen la parte transversal (cimientos, QA, producción).

| Escalón                      | Contiene                                                                                                     | Días acumulados | Horas acumuladas |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- | ---------------- |
| 1 · Núcleo operativo         | Login y roles + panel de carta (precios, agotados, stock) + notificaciones en tiempo real                    | 22.5            | 180              |
| 2 · + Reservas centralizadas | Reservar por web y por teléfono desde el panel, franjas tachadas, límite de terraza y correo de confirmación | 32              | 256              |
| 3 · + Dashboard              | Ventas, pedidos, reservas, platos más pedidos                                                                | 38              | 304              |
| 4 · + Pasarela de pagos      | Yape, Plin y tarjeta con confirmación automática                                                             | 53              | 424              |

La pasarela es el escalón más caro en horas y el único que además tiene **costos por venta y un trámite del negocio**. Si la dueña quiere abrir pronto, puede salir con los escalones 1-3 cobrando en efectivo y sumar la pasarela después.

## 5. Costos que pueden aparecer y hoy no están incluidos

| Concepto                                   | Estado                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cuenta de cliente con historial (módulo 7) | Opcional, versión 2.1: unos 6 días-persona (≈ 48 horas). No está en los escalones.                                                                          |
| Boleta y factura electrónica (SUNAT)       | La web **no** las emite en esta versión. El negocio debe revisar con su contador cómo cumple; si se integra un proveedor de comprobantes, se cotiza aparte. |
| WhatsApp automático (API oficial)          | Solo si la dueña lo pide; tiene proveedor y costo propios.                                                                                                  |
| Notificaciones push (PWA)                  | Mejora opcional (~3 días); no tiene costo mensual por sí misma.                                                                                             |
| Soporte y mantenimiento después de salir   | A definir: horas al mes incluidas, tiempo de respuesta y qué cuenta como «cambio nuevo».                                                                    |
| Fotos profesionales de los platos          | Pendiente del MVP (issue #25); mejora mucho las ventas pero no es desarrollo.                                                                               |

## 6. Fuentes consultadas (21-nov-2026)

- Vercel: [Pro plan (documentación oficial)](https://vercel.com/docs/plans/pro-plan) y [precios](https://vercel.com/pricing).
- Supabase: [precios](https://supabase.com/pricing) y [preguntas de facturación](https://supabase.com/docs/guides/platform/billing-faq).
- Resend: [precios](https://resend.com/pricing) y [guía de precios](https://resend.com/docs/knowledge-base/what-is-resend-pricing).
- Dominio `.pe`: [comparativa de registradores (KOM)](https://kom.pe/cuanto-cuesta-un-dominio-pe-en-2026-y-donde-comprarlo/), [EuroDNS](https://www.eurodns.com/es/dominios/dominio-pe), [OVHcloud](https://www.ovhcloud.com/es/domains/tld/pe/).
- Pasarelas (terceros, **a confirmar con cada proveedor**): [Culqi · tarifario abril 2026](https://www.culqi.com/static/files/tarifario_abril_26.pdf), [guía de pasarelas en Perú](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-peru), [Izipay vs Niubiz vs Culqi (KOM)](https://kom.pe/izipay-vs-niubiz-vs-culqi/), [Izipay (Prestamype)](https://www.prestamype.com/articulos/izipay-peru-que-es-y-como-funciona), [Mercado Pago en WooCommerce Perú (KOM)](https://kom.pe/como-integrar-mercado-pago-woocommerce-peru/), [Yape en Checkout API (Mercado Pago)](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/integration-configuration/yape).
