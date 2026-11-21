# 02 · Diseño de los módulos

Cada módulo trae: **objetivo, pantallas, datos, reglas, riesgos y pruebas**. Los puntos «A confirmar» van a la reunión con la dueña.

**Qué existe hoy (verificado en el código):** panel en `src/app/panel` con login (`LoginForm.tsx`), tablero de pedidos en tiempo real (`PanelBoard.tsx`), reservas (`ReservationsBoard.tsx`); roles `admin` y `cocina` en `staff_roles`; reservas por **aforo por franja de 30 minutos** (`branches.seats_per_slot`), máximo 20 personas, con fechas bloqueadas; pedidos con `payment_method` y `payment_status`; tabla `payment_events` con evento único por proveedor. Realtime solo se usa en `PanelBoard`.

---

## 1. Login y roles

**Objetivo:** que cada persona del equipo entre con su cuenta y vea solo lo que le corresponde.

### Roles

| Rol      | Quién                        | Puede                                                                                  | No puede                                 |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| `admin`  | Dueña / gerente              | Todo: carta, precios, stock, personal, dashboard, reembolsos, plano, reservas, pedidos | —                                        |
| `cocina` | Cocina / despacho            | Ver y avanzar pedidos de su sede; marcar «agotado» (no cambia precios)                 | Ventas, reservas, personal, precios      |
| `salon`  | Anfitrión / mozo (**nuevo**) | Ver y gestionar reservas y el plano de su sede; ver pedidos                            | Precios, dashboard, personal, reembolsos |

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

## 3. Reservas con plano de mesas

**Objetivo:** ver en un plano qué mesas están libres, reservadas u ocupadas, y que el sistema nunca asigne la misma mesa a dos reservas que se solapan.

### Decisión de diseño (recomendada)

| Quién        | Qué ve                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **Cliente**  | Elige fecha, hora, personas y zona (interior/terraza). **No elige la mesa exacta**: el sistema la asigna. |
| **Personal** | Ve el **plano del local en tiempo real** y puede mover una reserva a otra mesa.                           |

Por qué: dejar que el cliente elija la mesa crea conflictos (todos quieren la misma), obliga a mantener el plano exacto y no mejora la ocupación. Si la dueña quiere «elige tu mesa» para el cliente, es una mejora posterior sobre los mismos datos (ver «Fase 2» más abajo).

### Pantallas

- **Editor del plano** (`/panel/plano/editar`, solo `admin`): arrastrar mesas sobre un lienzo, definir etiqueta, asientos, forma (redonda/cuadrada/rectangular) y zona; un plano por sede. Hecho con SVG y eventos de puntero (sin librería de canvas) para mantener el panel liviano.
- **Plano del día** (`/panel/plano`): mesas coloreadas — 🟢 libre, 🟡 reservada próximamente, 🔴 ocupada ahora, ⚪ fuera de servicio. Selector de fecha y de hora (línea de tiempo), clic en una mesa → ver la reserva.
- **Lista de reservas** (existe, se mejora): hoy los estados son `confirmed`, `arrived`, `no_show` y `cancelled`. Se agregan `seated` (sentados) y `completed` (terminó) para que el plano distinga «llegó» de «ocupando la mesa» y libere la mesa al terminar (valores nuevos del enum, en su propia migración).
- **Alternativa accesible:** todo lo del plano también existe como lista (mesa, hora, estado), porque un plano solo gráfico no sirve con lector de pantalla ni en celulares pequeños.

### Datos

```sql
-- Mesas y su posición (en % del lienzo, para que escale en cualquier pantalla)
dining_tables (id, branch_id, label, seats smallint, area text, shape text,
               x numeric, y numeric, w numeric, h numeric, is_active boolean)

-- Duración de la reserva
reservations.ends_at timestamptz   -- starts_at + duración (por defecto 90 min, ajustable por tamaño de grupo)

-- Mesa(s) asignada(s); evita choques desde la base
reservation_tables (reservation_id, table_id, during tstzrange,
  exclude using gist (table_id with =, during with &&))   -- requiere la extensión btree_gist
```

La restricción de exclusión hace que **la base rechace** un solape aunque dos personas reserven al mismo milisegundo. Se debe cancelar/liberar la fila cuando la reserva se cancela.

### Reglas

- **Asignación automática:** la mesa libre más chica donde quepa el grupo en ese horario; si no hay, se intenta **juntar mesas adyacentes marcadas como combinables**. Si no hay nada → ese horario no se ofrece.
- Disponibilidad pública: se calcula como hoy por franja, pero en base a mesas libres, no a asientos sueltos.
- **Compatibilidad:** sedes sin plano configurado siguen con el aforo actual (`seats_per_slot`) mediante un interruptor por sede (`branches.uses_tables`). No se rompe lo que ya funciona.
- Reglas vigentes que se mantienen: máximo 20 personas, antelación mínima de 1 h, fechas bloqueadas, cancelación con el token de gestión.
- Una reserva que no se presenta pasa a `no_show` a los N minutos (a confirmar) y libera la mesa.
- Reservas hechas por teléfono: el personal puede **crearlas desde el panel** (mismo cálculo y misma restricción).

### A confirmar con la dueña (bloquean el módulo)

1. Cantidad de mesas por sede, asientos de cada una y plano aproximado (una foto del salón sirve).
2. ¿Cuáles se pueden juntar?
3. Duración típica de una reserva y tiempo de limpieza entre turnos.
4. ¿Cuánto esperan una reserva que no llega?
5. ¿Reciben clientes sin reserva (walk-ins)? El plano debería poder marcar una mesa «ocupada sin reserva».

### Fase 2 del módulo (no incluida en las estimaciones base)

«Elige tu mesa» para el cliente: mostrar el plano en la reserva pública. Requiere un plano muy fiel, bloqueo temporal de la mesa mientras el cliente completa (≈ 5 min) y manejo de abandono.

### Riesgos

- Plano desactualizado respecto al salón real → el editor es parte del módulo y la dueña lo puede corregir sola.
- Complejidad del cálculo de disponibilidad con mesas combinadas → se empieza **sin combinar** y se agrega la combinación en una segunda iteración.

### Pruebas

- Base de datos: dos reservas simultáneas en la misma mesa → una falla; cancelar libera la mesa.
- Unitarias: asignación (mejor ajuste, grupo grande, sin mesas), borde de horarios y cambio de día.
- E2E: reservar para 4 → aparece una mesa roja/amarilla en el plano del personal; cancelar → vuelve a verde.

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
| Reservas      | Por día, ocupación estimada de mesas, no-shows y cancelaciones                                               |

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
