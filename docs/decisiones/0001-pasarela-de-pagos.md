# ADR 0001 · Pasarela de pagos (F0-07)

- **Estado:** aceptada para el MVP (sandbox). La pasarela de producción se confirma con la dueña.
- **Fecha:** 2026-11-15
- **Responsable:** Axel

## Contexto

El MVP debe cobrar con **Yape, Plin y tarjeta** en modo prueba, con confirmación automática y sin capturas de pantalla (propuesta §11; README F3). La pasarela queda detrás de un adaptador (`lib/payments/`, F3-01) con una interfaz única (`createCharge`, `createYapeCharge`, `verifyWebhook`), así que cambiar de proveedor no toca la UI ni los pedidos.

Pendiente con la dueña (README §9): si ya tiene cuentas (Yape Empresas, POS de algún proveedor) o una pasarela preferida.

## Opciones comparadas

| Criterio                          | Culqi                                            | Izipay                                                | Mercado Pago                                                     |
| --------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Tarjetas (Visa, MC, Amex, Diners) | Sí                                               | Sí                                                    | Sí                                                               |
| Yape                              | Sí (código de aprobación en el checkout)         | Sí (código Yape)                                      | Sí (celular + OTP de 6 dígitos, Checkout API)                    |
| Plin                              | Vía QR de billeteras                             | **Sí, explícito** (celular afiliado a Interbank) y QR | **No** documentado                                               |
| Notificaciones                    | Webhook `order.status.changed` con autenticación | IPN con firma (HMAC según guías de terceros)          | Webhooks; la doc. de Yape confirma estado en la respuesta        |
| Sandbox autoservicio              | Llaves de integración al registrarse             | Credenciales de prueba ligadas a la afiliación        | **Sí:** credenciales de prueba y números Yape de prueba públicos |
| Comisión referencial*             | ~3.44 %–3.99 % + US$0.20 (+IGV según fuente)     | ~3.44 %–3.5 % + fijo (+IGV)                           | ~3.29 %–3.49 % + S/1.00 + IGV (según plazo de abono)             |
| Topes Yape                        | S/2,000 por código                               | S/2,000 por código                                    | Los define la app Yape (S/500, S/900 o S/2,000)                  |

\* Las cifras públicas no coinciden entre fuentes (son blogs, no tarifarios oficiales). **Antes de contratar hay que pedir la cotización escrita a cada proveedor**, porque varían por volumen y plazo de abono.

## Decisión

1. **Sandbox del MVP: Mercado Pago.** Es la única opción con credenciales de prueba inmediatas y casos de prueba públicos para Yape: `111111111` aprobado y `111111112`–`111111118` rechazos, todos con OTP `123456`. Eso permite construir y probar F3 (y que Rafael haga F3-Q1/F3-13) sin esperar una afiliación.
2. **Plin en la demo:** como Mercado Pago no lo ofrece, Plin se muestra con el **adaptador mock** (misma interfaz, respuesta simulada) y queda marcado en la UI de prueba. En producción, Plin llega con la pasarela definitiva.
3. **Producción: Izipay o Culqi**, porque ambas cubren Yape **y Plin**. Se elige con la dueña según la cotización, el plazo de abono y si ya tiene cuenta con alguna. Si se queda en Mercado Pago, Plin se cubriría con QR interoperable o se descarta.

## Consecuencias

- F3-01 implementa dos adaptadores: `mercadopago` (sandbox real) y `mock` (Plin y tests). Agregar `izipay` o `culqi` es sumar un archivo que cumpla la misma interfaz.
- Variables nuevas (solo servidor): `PAYMENTS_PROVIDER`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`; y la pública `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- El monto siempre se toma del pedido en el servidor y el webhook se verifica por firma y es idempotente (`payment_events.provider_event_id` único, ya en el esquema).
- **Acción para Axel:** crear la cuenta de desarrollador de Mercado Pago Perú y generar las **credenciales de prueba**.
- **Pregunta para la dueña:** ¿tiene cuenta con Izipay, Culqi o Niubiz, o Yape Empresas?

## Fuentes

- [Mercado Pago · Yape en Checkout API (doc. oficial)](https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/integration-configuration/yape)
- [Mercado Pago · Anuncio de Yape en Checkout API](https://www.mercadopago.com.pe/developers/en/news/2024/07/19/Integrate-Yape-into-Checkout-API-with-the-support-of-the-new-documentation)
- [Izipay · Medios de pago web (doc. oficial)](https://developers.izipay.pe/web-core/)
- [Culqi · Manual Shopify: webhook `order.status.changed` y Yape (PDF oficial)](https://docs.culqi.com/pdf/manual_shopify.pdf)
- Comisiones referenciales (terceros, a verificar): [paymentreview.com](https://paymentreview.com/blog/peru-card-yape-plin-payment-fees-2026/), [devsprinters.site](https://devsprinters.site/blog/comparativa-pasarelas-pago-peru-2026), [adratechsystems.com](https://adratechsystems.com/recursos/guia-completa-pasarelas-pago-peru-2026), [conit.pe](https://conit.pe/blog/izipay-institutos-como-funciona), [impulsastudio.pe](https://impulsastudio.pe/blog/pasarelas-de-pago-peru-comparativa)
