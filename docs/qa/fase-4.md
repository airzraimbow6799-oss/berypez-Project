# Casos de prueba · Fase 4 · Reservas, reclamos, legales y cookies

**Responsable:** Rafael (QA) · **Tareas:** F3-Q5 (casos), F4-Q1 a F4-Q4 (ejecución) · **Versión:** 1.0 · 2026-11-15

Leyenda: _Auto_ ✅ cubierto por Playwright · 🔜 por automatizar · «—» manual. _Env_: 🔑 necesita el `.env.local` de `berypez-dev`.
_Estado_: 🟢 construido en `main` · 🔒 pendiente de Axel (constancia por correo con Resend; RUC y razón social de la dueña).
Resultado: ☐ sin ejecutar · ✅ pasa · ❌ falla (issue) · ⚠️ observación.

**Reglas que se prueban:** franjas de 30 minutos según horario y aforo; anticipación mínima de **1 hora**; máximo **20 personas** por reserva
(más: «escríbenos por WhatsApp»); fechas bloqueadas; reserva sin sobreventa (bloqueo por franja en Postgres); cancelar con el enlace (`manage_token`).
Aforo y horario definitivos: pendientes de la dueña.

## 1. Reservas (🟢)

| ID    | Caso                                   | Pasos                                                                                        | Resultado esperado                                                                | Sev.    | Auto | Env | Resultado |
| ----- | -------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- | ---- | --- | --------- |
| RE-01 | La página carga                        | Abrir `/reservas`.                                                                           | Responde 200, título «Reservar \| Berypez», pasos visibles.                       | Alto    | ✅   | —   | ☐         |
| RE-02 | Reserva completa (F4-09)               | Recorrer los 4 pasos: sede, fecha y hora, personas y datos; confirmar.                       | Reserva creada, pantalla de confirmación animada y enlace para gestionarla.       | Crítico | 🔜   | 🔑  | ☐         |
| RE-03 | Navegación entre pasos                 | Retroceder, tocar «Cambiar» en el resumen.                                                   | «Cambiar» vuelve **directo al resumen**; no se pierden los datos.                 | Medio   | 🔜   | —   | ☐         |
| RE-04 | Franjas disponibles                    | Elegir cada sede y varios días.                                                              | Franjas cada 30 min, solo dentro del horario; las llenas aparecen no disponibles. | Alto    | —    | 🔑  | ☐         |
| RE-05 | Anticipación mínima                    | Intentar reservar dentro de la próxima hora y justo a los 60 minutos.                        | Dentro de la hora: rechazada. A los 60 minutos: permitida.                        | Alto    | —    | 🔑  | ☐         |
| RE-06 | Sobre el aforo                         | Llenar una franja y reservar una más.                                                        | Rechazada (409 «sin aforo»); la UI sugiere otra franja.                           | Crítico | —    | 🔑  | ☐         |
| RE-07 | Reservas simultáneas                   | Dos personas reservan la **última** plaza de la misma franja al mismo tiempo (dos pestañas). | Solo una la obtiene; no hay sobreventa.                                           | Crítico | —    | 🔑  | ☐         |
| RE-08 | Fechas bloqueadas y pasadas            | Elegir una fecha bloqueada, una pasada y una fuera del rango permitido.                      | No seleccionables; por API: 400 o 409.                                            | Alto    | —    | 🔑  | ☐         |
| RE-09 | Número de personas                     | 0, 1, 20, 21 y texto.                                                                        | 1 a 20 permitidos; 21 muestra el aviso de WhatsApp; 0 y texto se rechazan.        | Alto    | —    | —   | ☐         |
| RE-10 | Datos del cliente                      | Nombre vacío; celular inválido; correo opcional vacío, válido e inválido.                    | Mismas reglas que el checkout (celular de 9 dígitos que empieza con 9).           | Alto    | —    | —   | ☐         |
| RE-11 | Turnstile                              | Con la clave que aprueba, la que rechaza y sin token.                                        | Aprobada: crea. Rechazada o sin token: 403 y no se crea.                          | Alto    | —    | 🔑  | ☐         |
| RE-12 | Cancelar con el enlace                 | Abrir `/reservas/<token>` y cancelar; abrirlo otra vez.                                      | Se cancela, se libera el cupo y el enlace muestra «cancelada».                    | Alto    | 🔜   | 🔑  | ☐         |
| RE-13 | Token inválido                         | `/reservas/abc` y un token inexistente; adivinar el token de otra reserva.                   | 404 sin datos; nunca muestra la reserva de otra persona.                          | Crítico | 🔜   | 🔑  | ☐         |
| RE-14 | Límite de peticiones                   | Enviar reservas en ráfaga desde la misma IP.                                                 | 429 con mensaje claro.                                                            | Alto    | —    | 🔑  | ☐         |
| RE-15 | Zona horaria                           | Reservar desde un dispositivo con otra zona horaria.                                         | La hora se guarda y se muestra en hora de Lima.                                   | Medio   | —    | 🔑  | ☐         |
| RE-16 | Reserva en el panel                    | En `/panel/reservas`, ver la reserva del día y marcar «llegó» / «no vino».                   | Aparece en la sede correcta; los estados cambian y respetan el rol.               | Medio   | —    | 🔑  | ☐         |
| RE-17 | Confirmación por correo y recordatorio | Reservar con correo.                                                                         | 🔒 Correo de confirmación y recordatorio 2 h antes (depende de Resend).           | Alto    | —    | 🔒  | ☐         |

## 2. Libro de Reclamaciones (🟢; correo 🔒)

| ID    | Caso                  | Pasos                                                                    | Resultado esperado                                                        | Sev.    | Auto | Env | Resultado |
| ----- | --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------- | ---- | --- | --------- |
| LR-01 | La página carga       | Abrir `/libro-de-reclamaciones`.                                         | 200, título «Libro de Reclamaciones \| Berypez» y formulario visible.     | Alto    | ✅   | —   | ☐         |
| LR-02 | Reclamo completo      | Llenar todos los campos y enviar.                                        | Número correlativo, constancia imprimible y registro en la base.          | Crítico | 🔜   | 🔑  | ☐         |
| LR-03 | Número correlativo    | Enviar 3 reclamos seguidos.                                              | Números consecutivos y sin repetir, incluso enviados a la vez.            | Alto    | —    | 🔑  | ☐         |
| LR-04 | Validación            | Campos vacíos, texto muy largo, tipo «queja» y «reclamo», menor de edad. | Errores claros en español; los largos se rechazan.                        | Alto    | —    | —   | ☐         |
| LR-05 | Texto malicioso       | `<script>` y HTML en los campos; imprimir la constancia.                 | Se muestra como texto; no se ejecuta.                                     | Alto    | —    | 🔑  | ☐         |
| LR-06 | Turnstile y límites   | Sin token, token inválido, ráfaga de envíos.                             | 403 / 429 con mensaje claro; no se guardan reclamos falsos.               | Alto    | —    | 🔑  | ☐         |
| LR-07 | Datos del proveedor   | Revisar RUC y razón social en la constancia.                             | 🔒 Datos reales de la dueña (hoy pendientes).                             | Alto    | —    | —   | ☐         |
| LR-08 | Constancia por correo | Enviar con correo.                                                       | 🔒 Llega la constancia y hay copia al correo oficial (depende de Resend). | Alto    | —    | 🔒  | ☐         |

## 3. Páginas legales y cookies (🟢)

| ID    | Caso                    | Pasos                                                             | Resultado esperado                                                                   | Sev.    | Auto | Resultado |
| ----- | ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- | ---- | --------- |
| LG-01 | Páginas legales         | Abrir `/terminos`, `/privacidad` y `/devoluciones`.               | 200, título correcto, contenido en español y sin textos de relleno.                  | Alto    | ✅   | ☐         |
| LG-02 | Enlaces desde el flujo  | Pie de página, checkout y reserva.                                | Los enlaces legales funcionan desde el pie, el checkout y el libro de reclamaciones. | Alto    | 🔜   | ☐         |
| LG-03 | Datos de la empresa     | Revisar razón social, RUC y dirección en los textos.              | 🔒 Datos reales de la dueña (hoy pendientes).                                        | Alto    | —    | ☐         |
| LG-04 | Privacidad (Ley 29733)  | Leer: qué datos se recogen, para qué, plazo, derechos y contacto. | Completo y coherente con lo que la web realmente recoge.                             | Medio   | —    | ☐         |
| CK-01 | Antes de aceptar        | Entrar por primera vez y mirar la pestaña de red.                 | **No** se carga GA4 ni píxeles de seguimiento; aparece el aviso de cookies.          | Crítico | 🔜   | ☐         |
| CK-02 | Después de aceptar      | Aceptar.                                                          | Se carga GA4 (con `NEXT_PUBLIC_GA_ID` configurado) y el aviso desaparece.            | Alto    | —    | ☐         |
| CK-03 | Rechazar y recordar     | Rechazar y recargar; luego borrar el dato y volver.               | No se carga analítica; la decisión se recuerda; el aviso vuelve al borrarla.         | Alto    | —    | ☐         |
| CK-04 | Cambiar la decisión     | Buscar cómo retirar el consentimiento.                            | Existe una forma visible de cambiarlo.                                               | Medio   | —    | ☐         |
| CK-05 | Accesibilidad del aviso | Teclado, lector de pantalla y zoom 200 %.                         | Se puede aceptar o rechazar con teclado; no tapa el contenido ni la barra inferior.  | Alto    | —    | ☐         |

## 4. Seguridad de datos · RLS (F4-Q2) 🔑

Con la clave **anon** (la pública del navegador) y con `curl` o la consola de Supabase. Todo debe fallar salvo lo explícitamente público.

| ID    | Caso                      | Cómo                                                                                     | Resultado esperado                                                              | Sev.    | Resultado |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------- | --------- |
| RL-01 | Lectura pública permitida | `select` en `products`, `variants`, `menus`, `categories`, `branches`, `delivery_zones`. | Devuelve datos (solo lo publicado).                                             | Alto    | ☐         |
| RL-02 | Pedidos ajenos            | `select`, `insert`, `update`, `delete` en `orders` y `order_items`.                      | Todo denegado o vacío.                                                          | Crítico | ☐         |
| RL-03 | Reservas ajenas           | Lo mismo en `reservations`.                                                              | Todo denegado o vacío.                                                          | Crítico | ☐         |
| RL-04 | Reclamos                  | Lo mismo en `complaints`.                                                                | Todo denegado o vacío.                                                          | Crítico | ☐         |
| RL-05 | Pagos y personal          | `payment_events`, `staff_roles` y `email_log`.                                           | Denegado.                                                                       | Crítico | ☐         |
| RL-06 | Escritura en el catálogo  | `update` de un precio en `products` con anon y con un usuario `cocina`.                  | Anon: denegado. `cocina`: según la regla acordada (no debería cambiar precios). | Crítico | ☐         |
| RL-07 | Funciones (RPC)           | Llamar `checkout_create_order` y otras funciones con anon.                               | Denegado; solo el servidor las usa con la clave secreta.                        | Crítico | ☐         |
| RL-08 | Storage                   | Subir, reemplazar y borrar una foto en el bucket `catalog` con anon.                     | Lectura pública sí; escritura y borrado denegados.                              | Alto    | ☐         |
| RL-09 | Webhook de revalidación   | `POST /api/revalidate` sin secreto y con secreto incorrecto.                             | 401; con el secreto correcto, 200.                                              | Alto    | ☐         |

## 5. Dependencias

- **Axel:** `.env.local` y un usuario de prueba por rol (🔑); Resend (RE-17, LR-08); Turnstile real (F0-13).
- **La dueña:** aforo, horarios, RUC, razón social y correo oficial (RE-04 a RE-08, LR-07, LG-03).
