# 02 · Diseño de los módulos

Cada módulo trae: **objetivo, pantallas, datos, reglas, riesgos y pruebas**. Los puntos «A confirmar» van a la reunión con la dueña.

**Qué existe hoy (verificado en el código):** panel en `src/app/panel` con login (`LoginForm.tsx`), tablero de pedidos en tiempo real (`PanelBoard.tsx`), reservas (`ReservationsBoard.tsx`); roles `admin` y `cocina` en `staff_roles`; reservas por **aforo por franja de 30 minutos** (`branches.seats_per_slot`), máximo 20 personas, con fechas bloqueadas; pedidos con `payment_method` y `payment_status`; tabla `payment_events` con evento único por proveedor. Realtime solo se usa en `PanelBoard`.

---

## 1. Login y roles

**Objetivo:** que cada persona del equipo entre con su cuenta y vea solo lo que le corresponde.

### Roles

| Rol      | Quién                        | Puede                                                                           | No puede                                 |
| -------- | ---------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `admin`  | Dueña / gerente              | Todo: carta, precios, stock, personal, dashboard, reembolsos, reservas, pedidos | —                                        |
| `cocina` | Cocina / despacho            | Ver y avanzar pedidos de su sede; marcar «agotado» (no cambia precios)          | Ventas, reservas, personal, precios      |
| `salon`  | Anfitrión / mozo (**nuevo**) | Ver y gestionar las reservas de su sede; ver pedidos                            | Precios, dashboard, personal, reembolsos |

`branch_id` de `staff_roles` limita a una sede; `null` = todas (hoy ya funciona así).

### Pantallas

- `/panel/ingresar` (existe): se mejora con mensajes claros, «mostrar contraseña» y bloqueo temporal tras intentos fallidos.
- `/panel/personal` (solo `admin`): lista de personal, **invitar por correo**, cambiar rol o sede, **desactivar** (no borrar).
- Primer ingreso: la persona invitada define su contraseña desde el enlace del correo.
- Navegación (`PanelNav`) muestra solo las secciones del rol.

### Datos

- `alter type staff_role add value 'salon'` (migración propia).
- `staff_roles`: agregar `display_name text`, `is_active boolean default true`.
- `audit_log (id, at, user_id, action, entity, entity_id, before jsonb, after jsonb)`.

### Reglas

- Invitar usa `auth.admin.inviteUserByEmail` con la clave secreta, **solo desde el servidor y solo si quien llama es `admin`**.
- No se puede quitar el rol al **último** `admin` activo.
- Desactivar a alguien corta su acceso en la siguiente petición (se revisa `is_active` en `requireStaff`).
- Autenticación de dos pasos (TOTP) opcional para `admin`; Supabase Auth lo soporta. Se deja como mejora si la dueña lo quiere.
- Los **clientes no tienen cuenta** en la v2: siguen pidiendo como invitados con token de seguimiento. Cuentas de cliente (historial, puntos) quedan fuera de esta versión.

### Riesgos

- Un `admin` que se bloquea a sí mismo → la regla del último admin y un procedimiento documentado de recuperación con la clave secreta.
- Correos de invitación a spam → depende de Resend con SPF/DKIM/DMARC (F0-14 del README).

### Pruebas

- RLS: cada rol lee/escribe solo lo permitido, y lo contrario falla (incluye sede ≠ la suya).
- E2E: login de cada rol; `cocina` no ve `/panel/personal` ni `/panel/dashboard`.

---

## 2. Panel admin de la carta

**Objetivo:** cambiar precios, marcar agotados y controlar stock **sin entrar a Supabase** (hoy se hace desde el Table Editor, ver `F1-15`).

### Pantallas

- `/panel/carta`: tabla de platos agrupada por categoría, con búsqueda y filtros (agotados, sin foto, sin alérgenos).
- Por fila: **precio** (editable en línea), **interruptor disponible/agotado por sede**, **stock** (si aplica) y estado publicado.
- Edición de **variantes** (cada una con su precio y disponibilidad).
- Barra de acciones masivas: «agotar todo lo de esta categoría», «ajustar precios en %» con vista previa.
- «Reiniciar stock del día» (manual y automático a la hora de apertura).

### Datos

- `branch_products (branch_id, product_id, is_available, stock_qty int null, stock_resets_daily boolean, reset_to int null)`. `stock_qty null` = no se controla.
- El precio **sigue siendo global** (`products.price_cents`, `variants.price_cents`). Precio por sede queda como mejora si la dueña lo pide.
- Cada cambio de precio o stock escribe en `audit_log`.

### Reglas

- **El stock se descuenta dentro de la transacción de crear el pedido** (la RPC de checkout ya es transaccional): `update branch_products set stock_qty = stock_qty - n where stock_qty >= n` y, si no alcanza, el pedido falla con un mensaje claro («Ya no queda X»). Así dos clientes no se llevan la última porción.
- Si el stock llega a 0 → `is_available = false` automáticamente. Si se anula un pedido, se devuelve el stock.
- Al guardar, se invalida la caché de la carta con `revalidateTag` (el mecanismo de F1-02 ya existe).
- Cambios de precio fuera de rango (por ejemplo ±40 %) piden confirmación; precio negativo es imposible (restricción en la base).
- Los **pedidos ya creados conservan el precio con el que se hicieron** (`order_items` guarda el precio al momento).
- `cocina` puede marcar agotado, no cambiar precios (se aplica con RLS/RPC, no solo ocultando el botón).

### A confirmar con la dueña

- ¿Hay platos con **cantidad limitada** real (pescado del día, postres) o basta con «agotado / disponible»?
- ¿El stock se reinicia cada día? ¿A qué hora?
- ¿Los precios son iguales en las dos sedes?

### Riesgos

- Carrito del cliente con un precio viejo → ya está resuelto por `POST /api/cart/quote` (el precio siempre se calcula en el servidor); la UI avisa si cambió.
- Edición simultánea por dos personas → «última escritura gana» con aviso si el registro cambió desde que se abrió (comparar `updated_at`).

### Pruebas

- Concurrencia: dos pedidos a la vez sobre stock 1 → uno pasa, el otro falla.
- E2E: `admin` cambia un precio y el sitio público lo muestra; `cocina` intenta cambiarlo y es rechazado.

---

## 3. Reservas centralizadas (sin plano de mesas)

**Objetivo:** que **toda** reserva quede registrada en la web, venga de donde venga (el cliente desde la página, una llamada o un WhatsApp), y que nadie se pase del cupo. No se maneja número de mesa.

### Qué cambió y por qué

Según lo que comentó el local el 21-nov-2026 (audios del equipo):

- Hoy toman reservas por **WhatsApp y por llamada** y las anotan **en papel**. Eso es lo que causa los choques: dos personas piden la terraza a la misma hora, una llega primero y la otra se queda esperando.
- **No usan número de mesa por reserva:** el personal ya sabe cuál es cada mesa por su capacitación.
- Por eso el **plano de mesas, su editor y la asignación automática salen del alcance**. Lo que hace falta es **trazabilidad**: una sola fuente de verdad en la web.

La idea del equipo: si todo se registra en la web, lo que ya está reservado **aparece tachado** para el siguiente, y los administradores también reservan desde el panel cuando alguien llama.

### Cómo funciona

1. **Una sola fuente:** la tabla `reservations` (ya existe). Cada reserva guarda de dónde vino (`source`: web, teléfono o WhatsApp) y quién la registró (`created_by`, si fue personal).
2. **Cupo por franja y por zona.** Hoy hay un aforo por franja de 30 minutos (`seats_per_slot`) y una zona opcional (interior o terraza). Se suma un **límite de reservas de terraza por franja** (por ejemplo 2 o 3, lo define el local). Cuando se llena, la opción «Terraza» se **bloquea para esa hora** y quedan «Interior» y «Me da igual».
3. **El sitio público tacha** las franjas completas y muestra un mensaje claro: «La terraza está completa a esta hora. Elige interior o "me da igual"».
4. **El panel tiene una sección de Reservas** con:
   - la lista del día y de los próximos 7 días (ya existe),
   - el botón **«Nueva reserva»** para cuando alguien llama o escribe por WhatsApp: formulario corto (día, hora, personas, zona, nombre, celular, correo opcional, observación) que **muestra qué franjas están libres y cuáles ocupadas antes de guardar**,
   - la ocupación de cada franja del día, con el contador de terraza («2 de 3»).
5. **Misma validación para todos.** La web y el panel crean la reserva con la **misma función de la base de datos** (`reservations_create`, que ya bloquea por sede y franja dentro de la transacción). Así dos personas al mismo tiempo no superan el cupo, ni por la web ni por el panel.
6. **Correo de confirmación** (Resend; `email_log` ya existe): agradece, repite fecha y hora, pide **llegar 15 minutos antes** e incluye el enlace para cancelar (el token de gestión ya existe). Si la reserva fue por teléfono y no hay correo, no se envía.
7. **Aviso en vivo al panel** con cada reserva nueva, venga de la web o de otro administrador (módulo 4).
8. **Los correos sirven después:** con consentimiento del cliente, permiten avisos y promociones a clientes inactivos. Hay que pedir el consentimiento de forma explícita y revisar el tratamiento de datos personales (Ley 29733 de Perú) con asesoría legal antes de usarlos para publicidad.

### Pantallas

- **Reservas** (`/panel/reservas`): lista por día, con filtros por sede y estado; estados actuales `confirmed`, `arrived`, `no_show` y `cancelled`.
- **Nueva reserva** (desde la misma sección): formulario corto con las franjas libres y ocupadas a la vista.
- **Ocupación del día:** una tira de franjas con la barra de aforo y el contador de terraza.
- **Reserva pública** (`/reservas`): franjas tachadas y terraza bloqueada con su mensaje.

### Datos

- `reservations`: + `source` (`web` | `phone` | `whatsapp`), + `created_by` (usuario del personal, opcional), + `notes` (observación, opcional).
- `branches`: + `terrace_max_parties_per_slot` (nulo = sin límite). El administrador lo cambia desde el panel.
- `reservations_create` se amplía: valida el límite de terraza y acepta `source`, `created_by` y `notes`. Si la terraza está llena, responde con un error claro que la pantalla convierte en el mensaje de arriba.
- **No hay** `dining_tables`, ni restricción de exclusión, ni asignación de mesas.

### Reglas

- Se mantienen las vigentes: máximo 20 personas por reserva, antelación mínima de 1 hora, fechas bloqueadas y cancelación con el token de gestión.
- Una reserva hecha desde el panel entra con estado `confirmed` y **cuenta igual** para el cupo.
- «Si no está en la web, no existe»: el local deja de anotar en papel. Al lanzar se cargan las reservas que ya estén anotadas en papel.
- El personal puede editar o cancelar una reserva; el cambio libera la franja.
- Una reserva que no llega pasa a `no_show` pasado el tiempo de espera (a confirmar) y libera el cupo.

### A confirmar con la dueña (bloquean el módulo)

1. ¿Cuántas reservas de terraza al mismo tiempo caben por hora? ¿Y de interior?
2. ¿El aforo por franja actual (`seats_per_slot`, hoy 40) es correcto en cada sede?
3. ¿Cuánto tiempo ocupa una reserva (90 minutos, 2 horas)? Hoy se cuenta por franja de 30 minutos.
4. ¿Cuántos minutos esperan a una reserva que no llega?
5. ¿Quiénes van a registrar las reservas por llamada o WhatsApp? Se les capacita con pasos simples.
6. ¿Piden siempre el correo, o es opcional cuando reserva el personal por teléfono?

### Riesgos

- **Doble registro** (papel y web): se resuelve con la regla «si no está en la web, no existe» y con capacitación.
- **Límite de terraza mal puesto:** se ajusta desde el panel sin tocar código.
- **Correos a spam:** depende de Resend con SPF, DKIM y DMARC (tarea F0-14 del README).
- **Datos personales:** consentimiento explícito para usar el correo con fines de promoción.

### Pruebas

- Base de datos: dos reservas de terraza simultáneas con un solo cupo → una falla; cancelar libera el cupo; las reservas del panel y de la web cuentan igual.
- Unitarias: cálculo de franjas libres y ocupadas, bloqueo de terraza, borde de horarios y cambio de día.
- E2E: llamada simulada (reserva desde el panel) → la franja aparece tachada en la web; la web reserva la última terraza → el panel muestra «terraza completa».

### Fuera de alcance (mejora futura)

El plano de mesas, la asignación automática y «elige tu mesa» para el cliente. Si el local lo pide más adelante, se retoma sobre los mismos datos.

---

## 4. Notificaciones en tiempo real

**Objetivo:** que el personal se entere **en segundos** cuando entra una reserva o un pedido, sin recargar.

### Cómo funciona

1. El navegador del panel se suscribe a **Supabase Realtime** (`postgres_changes`) a `INSERT` en `reservations` y `orders`, filtrado por su sede. **Realtime respeta RLS**: solo llegan filas que ese rol puede leer.
2. Un `NotificationsProvider` en el layout del panel muestra: **aviso emergente**, **contador** en el menú, **sonido** (opcional) y el título de la pestaña parpadeando.
3. «Ya la vi» (`acknowledged_at`) apaga la alerta para todo el equipo.

### Detalles que importan

- **El sonido exige un gesto del usuario** (política de autoplay de los navegadores): el panel muestra un botón «Activar sonido» al entrar, y recuerda la elección.
- **Reconexión:** si se corta internet (pasa en celular), al reconectar se consultan las reservas/pedidos nuevos desde la última vez que se vio algo, para no perder avisos.
- El panel ya usa Realtime para pedidos (`PanelBoard.tsx`); se **extrae a un hook compartido** (`useRealtimeFeed`) para no duplicar lógica.
- A pocas personas conectadas `postgres_changes` alcanza. Si algún día crece, se pasa a Broadcast desde un trigger de la base.

### Cuando el panel está cerrado (opcional, por fases)

| Opción                      | Qué aporta                               | Costo / limitación                                                                                        |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Correo al local (Resend)    | Aviso aunque nadie mire el panel         | Ya hay `email_log`; entra en el plan gratuito mientras el volumen sea bajo.                               |
| **Notificación push (PWA)** | Aviso en el celular con el panel cerrado | Service worker + claves VAPID. En iPhone solo funciona con la web **instalada en la pantalla de inicio**. |
| WhatsApp automático         | El canal que más usa el local            | Requiere WhatsApp Business API (proveedor y costo aparte). Se deja como **pregunta**, no como compromiso. |

Recomendación: **panel en vivo + correo** en la versión base; **push** como mejora si la dueña lo pide.

### Pruebas

- E2E con dos contextos de navegador: el cliente reserva y el panel muestra el aviso en menos de unos segundos.
- Manual: cortar y devolver la red del celular y comprobar que no se pierde ningún aviso.

---

## 5. Pasarela de pagos

Resumen. Los requisitos del negocio, el flujo técnico, las pruebas y la lista de salida a producción están en [06-requisitos-pasarela.md](06-requisitos-pasarela.md).

- **Sandbox:** Mercado Pago (Yape de prueba incluido) detrás de un **adaptador** `PaymentProvider`; **Plin** con adaptador `mock` en la demo. Decidido en el [ADR 0001](../decisiones/0001-pasarela-de-pagos.md).
- **Producción:** Izipay o Culqi (ambas cubren Yape y Plin) según cotización escrita y lo que ya tenga la dueña.
- Cambios de pantalla: paso de pago en el checkout, estados «pendiente / pagado / falló», reintentar pago, y en el panel el botón de **reembolso** (solo `admin`).
- Antes de activar el cobro en línea hay que corregir el texto del sitio que promete Yape/Plin/Tarjeta mientras solo funciona efectivo (issue #59).

---

## 6. Dashboard

**Objetivo:** que la dueña, al abrir `/panel/dashboard`, entienda en 10 segundos cómo va el negocio. Solo `admin`.

### Qué muestra

| Bloque        | Indicadores                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Hoy           | Ventas del día, pedidos, ticket promedio, reservas del día, comparación con el mismo día de la semana pasada |
| Tendencia     | Ventas por día (7 / 30 días) y por hora del día                                                              |
| Pedidos       | Por estado, por modalidad (delivery / recojo), cancelaciones, tiempo medio de preparación                    |
| Carta         | Platos más y menos pedidos, categorías que más venden                                                        |
| Sedes y pagos | Ventas por sede, por método de pago (efectivo, Yape, Plin, tarjeta)                                          |
| Reservas      | Por día, ocupación por franja (y terraza), no-shows y cancelaciones                                          |

Filtros: sede, rango de fechas (hoy, 7 días, 30 días, mes, personalizado). Exportar a CSV.

### Cómo se construye

- **Agregados en SQL** (funciones `dashboard_summary`, `dashboard_sales_by_day`, `dashboard_top_products`…) con `security_invoker` para que respeten RLS, y agrupando por `America/Lima`.
- Índices en `orders (branch_id, created_at)` y `order_items (product_id)`.
- **Definición única de «venta»:** pedido `delivered` (o `paid`) y no cancelado. Se escribe en `docs/` y se prueba, porque si cada gráfico cuenta distinto, la dueña deja de confiar en el dashboard.
- Gráficos livianos (SVG propio o una librería pequeña); cargados solo en el panel para no tocar el rendimiento del sitio público.
- Actualización: al abrir y con botón «actualizar»; en tiempo real solo el contador «hoy».

### A confirmar

- ¿Qué números mira hoy la dueña (en cuaderno, Excel, caja)? Es lo primero que debe aparecer.
- ¿Hay costos o márgenes que quiera ver? (No se incluye en esta versión: requeriría cargar costos de insumos.)

### Pruebas

- Con un conjunto de pedidos conocido, los totales del dashboard coinciden exactamente con la suma hecha a mano.
- Borde de zona horaria: un pedido a las 23:50 de Lima cuenta en ese día.

---

## 7. Cuenta de cliente, historial y seguimiento (opcional, versión 2.1)

**Idea:** que quien pide pueda entrar con su cuenta, ver su historial de pedidos y reservas y seguir cómo va su pedido.

**Qué ya existe:** el **seguimiento sin cuenta**. Cada pedido tiene un enlace único (`tracking_token`, página `/pedido` y `GET /api/orders/[token]`) que muestra el estado paso a paso. Los pedidos hoy **no** se asocian a un usuario: se piden como invitado.

**Recomendación:** no obligar a crear cuenta. Quien pide una vez y quiere su ceviche rápido no debe pasar por un registro; exigirlo baja las ventas. Lo sensato es una **cuenta opcional**, ofrecida después de pedir («Guarda tus pedidos»).

### Cómo se haría

1. **Ingreso sin contraseña:** enlace mágico al correo con Supabase Auth (el cliente no recuerda ni guarda claves). Opción de Google más adelante.
2. **Asociar lo que ya hay:** `orders.user_id` y `reservations.user_id` (opcionales). Al entrar, se enlazan los pedidos y reservas hechos con el mismo correo confirmado.
3. **Pantallas:** «Mis pedidos» (historial con estado y total), detalle con el seguimiento paso a paso, «Mis reservas», botón «Volver a pedir» y datos guardados (celular, direcciones) para pagar más rápido.
4. **Seguridad:** políticas RLS para que cada cliente lea solo lo suyo; el seguimiento por enlace sigue funcionando para invitados.
5. **Datos personales:** consentimiento explícito y opción de borrar la cuenta (Ley 29733 de Perú; revisar con asesoría legal).

### Cuánto cuesta

Estimación nuestra (±30 %): **unos 6 días-persona** (≈ 2.5 de pantallas y ≈ 3.5 de base de datos, RLS, enlace mágico y pruebas). **No está incluida** en los 53 días del plan ni en los escalones del presupuesto; se agenda después de abrir al público, cuando haya clientes que repitan.

### Por qué no ahora

- La prioridad del local es **ordenar reservas y pedidos** y **cobrar en línea**.
- Una cuenta aporta más valor cuando ya hay clientes recurrentes y se quiere fidelizarlos (promociones a clientes inactivos, que también necesitan el correo y su consentimiento).
- El seguimiento del pedido, que es lo que el cliente más usa, **ya funciona** sin cuenta.

### A confirmar con la dueña

1. ¿Quiere un historial para el cliente, o con el seguimiento por enlace basta por ahora?
2. ¿Piensa en promociones o puntos para clientes frecuentes? (decide si conviene adelantar este módulo).
