# Casos de prueba · Fase 3 · Pagos, seguimiento y panel

**Responsable:** Rafael (QA) · **Tareas:** F2-Q5 (casos), F3-Q1 a F3-Q4 (ejecución) · **Versión:** 1.0 · 2026-11-15

Leyenda: _Auto_ ✅ cubierto por Playwright · 🔜 por automatizar · «—» manual. _Env_: 🔑 necesita `.env.local` de `berypez-dev` (y un usuario del panel con `npm run staff:create`).
_Estado_: 🟢 ya construido en `main` · 🔒 **bloqueado**: Axel todavía no lo construye (F3-01 a F3-03, F3-05 y F3-07 a F3-10).
Resultado: ☐ sin ejecutar · ✅ pasa · ❌ falla (issue) · ⚠️ observación.

## 1. Estados del pedido y seguimiento (🟢)

Flujo: **Recibido → En cocina → En camino** (delivery) o **Listo para recoger** (recojo) **→ Entregado**.
Las transiciones se validan en la API y en la base de datos (trigger).

| ID    | Caso                          | Pasos                                                                                       | Resultado esperado                                                                         | Sev.    | Env | Resultado |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------- | --- | --------- |
| SG-01 | Seguimiento del cliente       | Abrir `/pedido/<token>` de un pedido real.                                                  | Línea de tiempo con el estado actual, resumen, sede y botón de WhatsApp de esa sede.       | Alto    | 🔑  | ☐         |
| SG-02 | Se actualiza solo             | Con la página abierta, el panel cambia el estado.                                           | La página se actualiza sola (cada ~15 s) sin recargar.                                     | Alto    | 🔑  | ☐         |
| SG-03 | Flujo de recojo y de delivery | Llevar un pedido de recojo y uno de delivery hasta «Entregado».                             | Recojo termina en «Listo para recoger»; delivery pasa por «En camino».                     | Alto    | 🔑  | ☐         |
| SG-04 | Transición inválida           | Por API, intentar saltar de «Recibido» a «Entregado» o volver de «Entregado» a «En cocina». | Rechazado (API y trigger de la base); el estado no cambia.                                 | Crítico | 🔑  | ☐         |
| SG-05 | Pedido cancelado o ajeno      | Abrir el token de un pedido cancelado y uno inexistente.                                    | Cancelado: se ve como tal. Inexistente: 404 sin datos.                                     | Medio   | 🔑  | ☐         |
| SG-06 | Datos del cliente             | Revisar qué datos devuelve `GET /api/orders/<token>`.                                       | Solo lo necesario (sin correo ni teléfono completos de otros; sin ids internos sensibles). | Alto    | 🔑  | ☐         |

## 2. Panel del restaurante (🟢)

| ID    | Caso                      | Pasos                                                                                     | Resultado esperado                                                                                  | Sev.    | Env | Resultado            |
| ----- | ------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------- | --- | -------------------- |
| PA-01 | Sin sesión                | Abrir `/panel` y `/panel/reservas` sin iniciar sesión.                                    | Redirige a `/panel/ingresar`; no muestra ningún pedido.                                             | Crítico | —   | ✅ (E2E de `/panel`) |
| PA-02 | API del panel sin sesión  | `PATCH /api/admin/orders/<id>/status` y `/api/admin/reservations/<id>/status` sin sesión. | 401 o 403; el estado no cambia.                                                                     | Crítico | 🔑  | ☐                    |
| PA-03 | Login                     | Correcto, contraseña errónea, usuario inexistente y 10 intentos seguidos.                 | Mensaje genérico (no revela si el correo existe); límite de intentos y Turnstile.                   | Alto    | 🔑  | ☐                    |
| PA-04 | Pedido nuevo en vivo      | Con el panel abierto en una tablet, crear un pedido desde otro dispositivo.               | Aparece al instante y suena. Probar con la pantalla bloqueada y la pestaña en segundo plano.        | Alto    | 🔑  | ☐                    |
| PA-05 | Avanzar el estado         | Usar los botones de estado.                                                               | Cambia, se refleja en el seguimiento del cliente y no permite saltos.                               | Alto    | 🔑  | ☐                    |
| PA-06 | Rol `cocina` vs `admin`   | Entrar con cada rol y con un usuario de **otra sede**.                                    | Cada rol ve solo lo que le corresponde; un usuario de Lince no ve ni cambia pedidos de Jesús María. | Crítico | 🔑  | ☐                    |
| PA-07 | Filtros                   | Filtrar por sede y estado.                                                                | Resultados correctos y el contador coincide.                                                        | Medio   | 🔑  | ☐                    |
| PA-08 | Usable en tablet          | Usar el panel en tablet de 10" en horizontal y vertical.                                  | Botones grandes, sin scroll horizontal, legible a un metro.                                         | Medio   | 🔑  | ☐                    |
| PA-09 | Cerrar sesión y caducidad | Cerrar sesión; dejar la sesión abierta horas.                                             | Tras cerrar sesión, «atrás» del navegador no muestra el panel; la sesión caducada pide ingresar.    | Alto    | 🔑  | ☐                    |
| PA-10 | Reservas del día          | En `/panel/reservas`: marcar «llegó», «no vino» y cancelar.                               | Cambia el estado y respeta el rol y la sede.                                                        | Medio   | 🔑  | ☐                    |

## 3. Pagos con Yape, Plin y tarjeta (🔒)

> **Bloqueado.** `POST /api/payments`, el webhook, el adaptador de pasarela y la UI de pago no existen todavía. Decisión de pasarela:
> [Mercado Pago en sandbox](../decisiones/0001-pasarela-de-pagos.md) (Plin con adaptador mock). Estos casos se ejecutan cuando Axel los entregue.

| ID    | Caso                      | Pasos                                                                    | Resultado esperado                                                                             | Sev.    | Resultado |
| ----- | ------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------- | --------- |
| PG-01 | Selector de medio de pago | Llegar al checkout con datos válidos.                                    | Aparece **después** de validar y con el total final; Yape, Plin, Tarjeta y Efectivo con logos. | Alto    | ☐         |
| PG-02 | Tarjeta aprobada          | Tarjeta de prueba aprobada.                                              | Pedido `paid`; pantalla de éxito; sin `alert()`.                                               | Crítico | ☐         |
| PG-03 | Tarjeta rechazada         | Tarjeta de prueba rechazada y fondos insuficientes.                      | Mensaje claro, opción de reintentar u otro medio; el pedido **no** queda `paid`.               | Crítico | ☐         |
| PG-04 | 3-D Secure                | Tarjeta de prueba con 3DS (aprobar y fallar el desafío).                 | Flujo completo sin perder el pedido.                                                           | Alto    | ☐         |
| PG-05 | Yape de prueba            | Casos de prueba públicos de Mercado Pago (aprobado, rechazado, vencido). | Estados de espera, éxito y error correctos.                                                    | Alto    | ☐         |
| PG-06 | Monto cobrado             | Comparar monto cobrado, total del pedido y total de pantalla.            | Iguales siempre; el monto sale del pedido en el servidor, no del navegador.                    | Crítico | ☐         |
| PG-07 | Doble pago                | Pagar dos veces el mismo pedido (doble clic, dos pestañas).              | Idempotente: un solo cobro.                                                                    | Crítico | ☐         |
| PG-08 | Pago abandonado           | Empezar a pagar y cerrar la pestaña.                                     | El pedido no queda `paid`; se puede reintentar.                                                | Alto    | ☐         |

## 4. Webhook de la pasarela (🔒)

| ID    | Caso                     | Cómo                                                                  | Resultado esperado                                                         | Sev.    | Resultado |
| ----- | ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------- | --------- |
| WH-01 | Firma válida             | Enviar un evento firmado de pago aprobado.                            | Marca el pedido `paid` y registra el evento en `payment_events`.           | Crítico | ☐         |
| WH-02 | Firma inválida o ausente | Sin firma, firma alterada, cuerpo modificado.                         | Rechazado (401/403); el pedido no cambia.                                  | Crítico | ☐         |
| WH-03 | Evento repetido          | El mismo evento dos veces.                                            | No duplica nada (idempotente).                                             | Crítico | ☐         |
| WH-04 | Evento tardío            | Llega «aprobado» después de un «rechazado» o con el pedido cancelado. | Se aplica la regla de negocio acordada, sin dejar un estado inconsistente. | Alto    | ☐         |
| WH-05 | Monto distinto           | Evento de pago con un monto diferente al del pedido.                  | No marca como `paid`; queda para revisión.                                 | Crítico | ☐         |

## 5. Correos con Resend (🔒)

> **Bloqueado** hasta que Axel construya `lib/email/`, las plantillas (F3-15) y verifique el dominio de envío (F0-14).

| ID    | Caso                   | Pasos                                                        | Resultado esperado                                                           | Sev.  | Resultado |
| ----- | ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----- | --------- |
| CO-01 | Llegada a la bandeja   | Pedido con correo de Gmail, Outlook y Hotmail.               | Llega a la **bandeja de entrada**, no a spam; remitente y dominio correctos. | Alto  | ☐         |
| CO-02 | Contenido y plantillas | Pedido recibido, pago aprobado, en camino/listo y entregado. | Datos correctos (número, total, sede); legible en celular y en modo oscuro.  | Medio | ☐         |
| CO-03 | Reenviar confirmación  | Usar «Reenviar confirmación» 4 veces.                        | Funciona 3 veces; la cuarta se bloquea con un mensaje claro.                 | Medio | ☐         |
| CO-04 | Pedido sin correo      | Pedir sin correo.                                            | No intenta enviar y no da error.                                             | Medio | ☐         |
| CO-05 | Rebotes                | Pedir con un correo inexistente.                             | Se registra el rebote en `email_log`; el pedido no se ve afectado.           | Medio | ☐         |
| CO-06 | SPF, DKIM y DMARC      | Revisar los encabezados del correo recibido.                 | Los tres en «pass».                                                          | Alto  | ☐         |

## 6. Tiempo real y seguridad de datos (🟢)

| ID    | Caso                | Cómo                                                  | Resultado esperado          | Sev.    | Env | Resultado |
| ----- | ------------------- | ----------------------------------------------------- | --------------------------- | ------- | --- | --------- |
| RT-01 | Realtime sin sesión | Con la clave anon, suscribirse a cambios de `orders`. | No recibe pedidos de nadie. | Crítico | 🔑  | ☐         |
| RT-02 | Un pedido a la vez  | Dos clientes con dos tokens distintos abiertos.       | Cada uno ve solo su pedido. | Crítico | 🔑  | ☐         |

## 7. Dependencias

- **Axel:** entregar F3-01 a F3-03 (pasarela y webhook), F3-05 y F3-15 (correos), F3-07 a F3-10 (UI de pago), y crear un usuario de prueba del panel por rol y sede.
- **Cuenta de prueba de Mercado Pago** (decisión F0-07 pendiente de crear).
