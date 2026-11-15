# Casos de prueba · Fase 2 · Carrito y checkout

**Responsable:** Rafael (QA) · **Tareas:** F1-Q5 (casos), F2-Q1 a F2-Q4 (ejecución) · **Versión:** 1.0 · 2026-11-15

Leyenda: _Auto_ ✅ cubierto por Playwright · 🔜 por automatizar · «—» manual. _Env_: 🔑 necesita el `.env.local` de `berypez-dev`.
Resultado: ☐ sin ejecutar · ✅ pasa · ❌ falla (issue) · ⚠️ observación.

**Reglas del servidor que se prueban** (de [`docs/api.md`](../api.md) y `features/checkout/schema.ts`): nombre de 2 a 80 caracteres;
celular de 9 dígitos que empieza con 9 (acepta `+51` y espacios); correo opcional pero válido; delivery exige distrito y dirección (≥ 5);
recojo no pide dirección; términos aceptados; Turnstile; 1 a 30 líneas y cantidad de 1 a 50; en esta fase solo `paymentMethod: "cash"`.
Horario provisional 11:00–17:00 (hora de Lima) y tarifa fija S/ 7.50: **confirmar con la dueña** antes de dar por buenos los casos de horario.

## 1. Carrito

| ID    | Caso                           | Pasos                                                                      | Resultado esperado                                                                          | Sev.    | Auto       | Env | Resultado |
| ----- | ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------- | ---------- | --- | --------- |
| CA-01 | Agregar sin recargar           | Desde la carta, agregar un plato.                                          | Aviso en < 300 ms, el contador del header rebota y sube.                                    | Alto    | ✅ parcial | —   | ☐         |
| CA-02 | Carrito vacío                  | Abrir `/carrito` sin platos y `/checkout` sin platos.                      | Mensaje claro y enlace a la carta; el checkout no deja continuar («Tu carrito está vacío»). | Alto    | 🔜         | —   | ☐         |
| CA-03 | Cambiar cantidad y quitar      | Subir, bajar a 0 y quitar una línea.                                       | Total correcto en cada paso; al llegar a 0 pide confirmar o quita la línea.                 | Alto    | —          | 🔑  | ☐         |
| CA-04 | Nota por plato                 | Escribir una nota en la vista rápida y verla en el carrito.                | La nota se conserva y se envía al pedido; máximo 200 caracteres.                            | Medio   | —          | 🔑  | ☐         |
| CA-05 | Persistencia                   | Agregar platos, recargar y cerrar/abrir la pestaña.                        | El carrito se conserva (localStorage). Si localStorage falla, la página sigue funcionando.  | Alto    | 🔜         | —   | ☐         |
| CA-06 | Mismo plato, distinta variante | Agregar «Sudados» con Cabrilla y luego con Chita.                          | Son dos líneas distintas con su precio; el mismo plato y variante suma cantidad.            | Alto    | 🔜         | —   | ☐         |
| CA-07 | Total del servidor             | Comparar el total de la pantalla con `POST /api/cart/quote`.               | Coinciden siempre.                                                                          | Crítico | —          | 🔑  | ☐         |
| CA-08 | Precio cambió                  | Con el carrito lleno, cambiar un precio en Supabase y recargar `/carrito`. | Aviso de «el precio cambió» y total actualizado; no se cobra el precio viejo.               | Alto    | —          | 🔑  | ☐         |
| CA-09 | Plato agotado en el carrito    | Marcar un plato como agotado con el carrito lleno.                         | Aviso claro; no se puede finalizar el pedido con ese plato.                                 | Alto    | —          | 🔑  | ☐         |
| CA-10 | Sugerencias y mínimo           | Revisar sugerencias de bebidas y la barra «te faltan S/ X».                | Aparecen y la cifra es correcta según el mínimo de la zona.                                 | Medio   | —          | 🔑  | ☐         |
| CA-11 | Pedido por WhatsApp            | Tocar el botón de WhatsApp con el carrito lleno, en cada sede.             | Abre `wa.me` con el **carrito completo** y el número de la sede elegida.                    | Alto    | —          | —   | ☐         |

## 2. Modalidad, sede y horario

| ID    | Caso                      | Pasos                                                                            | Resultado esperado                                                                | Sev.  | Env | Resultado |
| ----- | ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----- | --- | --------- |
| MO-01 | Delivery / Recojo         | Cambiar entre Delivery, Recojo Lince y Recojo Jesús María.                       | Muestra tarifa, tiempo y mínimo; se recuerda en la sesión.                        | Alto  | 🔑  | ☐         |
| MO-02 | Cambio de sede a mitad    | Con el carrito lleno, cambiar de sede dos veces.                                 | El total y el mínimo se recalculan; el carrito no se pierde.                      | Alto  | 🔑  | ☐         |
| MO-03 | Zonas de reparto          | Elegir cada uno de los 7 distritos.                                              | Tarifa y tiempo correctos (hoy S/ 7.50 fijo). Un distrito inexistente se rechaza. | Alto  | 🔑  | ☐         |
| MO-04 | Dentro y fuera de horario | Con la hora de Lima antes de 11:00, a las 16:59, a las 17:00 y después.          | Antes y después: «cerrado» y no deja pedir; dentro: permite.                      | Alto  | 🔑  | ☐         |
| MO-05 | Pedido programado         | Programar una hora válida, una fuera de horario, una pasada y un texto inválido. | Solo acepta una hora futura dentro del horario; mensaje claro en los demás casos. | Alto  | 🔑  | ☐         |
| MO-06 | Zona horaria              | Probar desde un dispositivo con otra zona horaria.                               | El horario siempre se evalúa en hora de Lima.                                     | Medio | 🔑  | ☐         |

## 3. Checkout (validación)

| ID    | Caso                   | Datos                                                                         | Resultado esperado                                                                      | Sev.    | Resultado |
| ----- | ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------- | --------- |
| CH-01 | Campos obligatorios    | Enviar vacío.                                                                 | Errores en español junto a cada campo; el foco va al primer error.                      | Alto    | ☐         |
| CH-02 | Nombre                 | `A`, 81 caracteres, solo espacios, `Ñandú Pérez`.                             | Rechaza 1 y 81 y solo espacios; acepta con tildes y ñ.                                  | Medio   | ☐         |
| CH-03 | Celular                | `912345678`, `+51 912 345 678`, `812345678`, `91234567`, letras.              | Acepta los dos primeros; rechaza el resto («9 dígitos que empiece con 9»).              | Alto    | ☐         |
| CH-04 | Correo opcional        | Vacío, `a@b.com`, `a@`, 255 caracteres.                                       | Vacío y válido pasan; inválido muestra «Revisa el correo».                              | Medio   | ☐         |
| CH-05 | Recojo sin dirección   | Modalidad recojo.                                                             | No pide dirección ni distrito; el pedido se crea.                                       | Alto    | ☐         |
| CH-06 | Delivery sin dirección | Delivery con distrito vacío y luego con dirección de 4 caracteres.            | Pide distrito y dirección (mínimo 5 caracteres).                                        | Alto    | ☐         |
| CH-07 | Términos               | Sin marcar «acepto».                                                          | No deja enviar: «Acepta los términos para continuar».                                   | Alto    | ☐         |
| CH-08 | Turnstile              | Clave de prueba que aprueba; clave que rechaza; sin token.                    | Aprobada: crea el pedido. Rechazada o sin token: 403 y mensaje claro, no se crea.       | Alto    | ☐         |
| CH-09 | Texto malicioso        | `<script>alert(1)</script>` y 10 000 caracteres en nombre, dirección y notas. | Se muestra como texto, no se ejecuta; los largos se rechazan; sin error 500.            | Alto    | ☐         |
| CH-10 | Doble clic en «Pedir»  | Tocar el botón dos veces rápido.                                              | Se crea **un solo** pedido; el botón se bloquea mientras envía.                         | Crítico | ☐         |
| CH-11 | Efectivo y vuelto      | Pagar en efectivo con vuelto menor al total, igual y mayor.                   | Menor: se rechaza o avisa; igual o mayor: se guarda.                                    | Medio   | ☐         |
| CH-12 | Otros medios de pago   | Intentar `yape`, `plin` y `card` en esta fase.                                | Responde 400 (no disponibles hasta la Fase 3); la UI no los ofrece como si funcionaran. | Medio   | ☐         |

## 4. Pedido recibido y seguimiento básico

| ID    | Caso                    | Pasos                                                             | Resultado esperado                                                                           | Sev.    | Auto | Env | Resultado |
| ----- | ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------- | ---- | --- | --------- |
| PE-01 | Compra completa (F2-13) | Carta → 2 platos con variante → recojo en Jesús María → checkout. | Pedido en Supabase con el **total correcto**, estado `pending` y pantalla «Pedido recibido». | Crítico | 🔜   | 🔑  | ☐         |
| PE-02 | Pantalla de pedido      | Revisar número, resumen, tiempo estimado y enlace de seguimiento. | Datos correctos; el enlace usa el `trackingToken`.                                           | Alto    | —    | 🔑  | ☐         |
| PE-03 | Token inválido          | Abrir `/pedido/abc` y `/pedido/<uuid inexistente>`.               | 404 sin revelar datos ni errores técnicos.                                                   | Alto    | 🔜   | —   | ☐         |
| PE-04 | Privacidad del pedido   | Cambiar un dígito del token de un pedido real.                    | 404; nunca muestra el pedido de otra persona.                                                | Crítico | —    | 🔑  | ☐         |

## 5. Seguridad del servidor (F2-Q2 y F2-Q3)

| ID    | Caso                        | Cómo                                                                                                           | Resultado esperado                                                                  | Sev.    | Resultado |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- | --------- |
| SE-01 | Precio manipulado           | Desde DevTools o `curl`, enviar `priceCents` o `totalCents` inventados en `/api/cart/quote` y `/api/checkout`. | El servidor los ignora y calcula con los precios de la base; el total no cambia.    | Crítico | ☐         |
| SE-02 | Cantidades inválidas        | `quantity` 0, -1, 51, 1.5, `"2"`; 31 líneas.                                                                   | 400 `invalid_input` con `fields`; nunca 500.                                        | Alto    | ☐         |
| SE-03 | Ids inexistentes o cruzados | `productId` que no existe; `variantId` de **otro** producto; `choices` que no son del plato.                   | 400 o 409 con mensaje claro; no se crea pedido.                                     | Crítico | ☐         |
| SE-04 | Variante agotada            | Pedir una variante con `isAvailable = false`.                                                                  | 409 (plato agotado); no se crea pedido.                                             | Alto    | ☐         |
| SE-05 | Total del cliente distinto  | Enviar el carrito con el total de otro momento (precio cambió).                                                | 409 `cart_changed`; la pantalla avisa y muestra el total nuevo.                     | Alto    | ☐         |
| SE-06 | Límite de peticiones        | Superar 120 cotizaciones en 10 min y 10 pedidos en 10 min por IP.                                              | 429 con mensaje claro y tiempo de espera; después de la ventana vuelve a funcionar. | Alto    | ☐         |
| SE-07 | Pedido sin Turnstile        | `POST /api/checkout` sin token o con token repetido.                                                           | 403 `turnstile_failed`; no se crea nada.                                            | Alto    | ☐         |
| SE-08 | Método y cuerpo incorrectos | `GET /api/checkout`, JSON roto, cuerpo vacío, `Content-Type` erróneo.                                          | 405 o 400 controlados, sin trazas internas.                                         | Medio   | ☐         |
| SE-09 | Fuga de datos en el cliente | Buscar secretos en el HTML, JS y pestaña de red: `service_role`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`.      | No aparece ninguno; solo claves públicas (`NEXT_PUBLIC_*`).                         | Crítico | ☐         |

## 6. Prueba con usuarios (F2-Q4)

3 personas (una mayor de 60 años) arman un pedido sin ayuda desde la portada hasta «Pedido recibido».
**Meta:** menos de 3 minutos y sin errores bloqueantes. Registrar por persona: tiempo, errores, dudas y textos confusos.

| Persona         | Dispositivo | Tiempo | Errores | Observaciones |
| --------------- | ----------- | ------ | ------- | ------------- |
| 1 (joven)       |             |        |         |               |
| 2 (adulto)      |             |        |         |               |
| 3 (mayor de 60) |             |        |         |               |

## 7. Dependencias

- **Axel:** `.env.local` de `berypez-dev` para los casos 🔑; confirmar con la dueña el horario y las zonas.
- **Lo ya construido:** carrito, cotizador, checkout en efectivo y pedido recibido están en `main`; se pueden probar hoy.
