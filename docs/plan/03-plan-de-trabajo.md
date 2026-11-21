# 03 · Plan de trabajo

**Orden propuesto:** cimientos → **frontend sobre datos simulados** → **reunión 1 con la dueña** → backend real → pasarela en sandbox → **reunión 2 (UAT)** → producción.

Es el orden que se planteó (primero todo el front, luego feedback y después backend, pasarela, etc.), con **tres ajustes** para que no salga caro:

1. **Antes del front se cierran los contratos** (esquemas Zod y borrador de tablas de cada módulo). Es medio día de trabajo y evita rehacer pantallas cuando llegue la base real.
2. **El front se construye contra los mocks de MSW que ya existen** (F0-11), con datos de ejemplo parecidos a los reales. Se ve y se siente como el producto final.
3. **El trámite de la pasarela arranca en la reunión 1**, no al final. Lo hace el negocio y, según las fuentes consultadas, la afiliación toma de 5 a 15 días hábiles. Si espera a que termine el código, el proyecto se queda parado.

> No se descarta nada del backend que ya está hecho: login, RLS, pedidos, tiempo real de pedidos y reservas por aforo **siguen funcionando** durante todo el plan.

## 1. Línea de tiempo

Semanas de **trabajo efectivo** con dos personas a tiempo completo. Si cada uno dedica medio tiempo, se duplica el calendario; la secuencia no cambia.

| Semana                                                                       | 1   | 2   | 3   | 4   | 5   | 6   | 7   |
| ---------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| Fase 0 · Cimientos y contratos                                               | ■   |     |     |     |     |     |     |
| Fase A · Frontend sobre mocks                                                | ■   | ■   | ■   |     |     |     |     |
| **Hito 1 · Reunión con la dueña**                                            |     |     | ◆   |     |     |     |     |
| Trámite de la pasarela (lo hace el negocio, 5-15 días hábiles según fuentes) |     |     | ■   | ■   | ■   |     |     |
| Fase B · Backend real                                                        |     |     | ■   | ■   | ■   |     |     |
| Fase C · Pasarela en sandbox                                                 |     |     | ■   | ■   | ■   |     |     |
| **Hito 2 · Pruebas de aceptación**                                           |     |     |     |     |     | ◆   |     |
| Fase D · Producción                                                          |     |     |     |     |     | ■   | ■   |

## 2. Fases, entregables y condiciones de salida

### Fase 0 · Cimientos y contratos (semana 1)

| ID    | Tarea                                                                                                | Resp.   | Días | Depende |
| ----- | ---------------------------------------------------------------------------------------------------- | ------- | ---- | ------- |
| P0-01 | Base del panel: `requireStaff(roles)`, navegación por rol, layout, componentes de tabla y formulario | **R**   | 1.5  | —       |
| P0-02 | Contratos: esquemas Zod + borrador SQL de los 6 módulos; revisión cruzada entre ambos                | **A+R** | 1.5  | —       |
| P0-03 | Lista de preguntas y agenda de la reunión 1 (sección 5 del [README](README.md))                      | **R**   | 0.5  | —       |
| P0-04 | Destrabar la publicación en Vercel (#62) y corregir el texto de medios de pago (#59)                 | **A**   | 0.5  | —       |

**Sale de la fase cuando:** los contratos de los 6 módulos están revisados por la otra persona y el panel base está en `develop`.

### Fase A · Frontend sobre datos simulados (semanas 1-3)

Cada quien arma las pantallas de **sus** módulos (ver [04-reparto-equipo.md](04-reparto-equipo.md)). Los mocks marcan en pantalla «datos de ejemplo».

| ID   | Tarea                                                                                                   | Resp. | Días | Depende |
| ---- | ------------------------------------------------------------------------------------------------------- | ----- | ---- | ------- |
| A-R1 | Login mejorado y `/panel/personal` (invitar, rol, sede, desactivar)                                     | **R** | 1.5  | P0-01   |
| A-R2 | `/panel/carta`: tabla editable de precios, interruptores de agotado, stock, acciones masivas            | **R** | 3    | P0-01   |
| A-R3 | Notificaciones: provider, aviso, contador, sonido, hook `useRealtimeFeed` (sobre pedidos ya existentes) | **R** | 2    | P0-01   |
| A-R4 | `/panel/dashboard`: tarjetas, tendencia, top de platos, filtros, exportar CSV                           | **R** | 3.5  | P0-01   |
| A-A1 | Editor del plano (arrastrar mesas, forma, asientos, zona) en SVG                                        | **A** | 3    | P0-02   |
| A-A2 | Plano del día con línea de tiempo + lista de reservas con estados nuevos                                | **A** | 2.5  | A-A1    |
| A-A3 | Ajustes a la reserva pública (zona, mensajes claros) y alta de reserva por teléfono desde el panel      | **A** | 0.5  | P0-02   |
| A-A4 | Checkout: paso de pago (Yape, Plin, tarjeta), estados pendiente/pagado/falló, reintento                 | **A** | 2.5  | P0-02   |

**Sale de la fase cuando:** las 6 áreas se pueden recorrer en un enlace de Vercel (preview) en celular y escritorio, sin errores en consola y con CI en verde.

### Hito 1 · Reunión con la dueña (semana 3)

Duración sugerida: 60 a 90 minutos, en el local si se puede (para ver el salón).

1. **Demo guiada (20 min):** panel de carta, plano, notificación de reserva en vivo, dashboard, checkout con pago.
2. **Que lo toque ella** (20 min), con el celular en la mano. Anotar dónde duda.
3. **Preguntas de decisión** (30 min): las 7 de la sección 5 del [README](README.md).
4. **Arrancar el trámite de la pasarela** con lo que necesita el proveedor (ver [06-requisitos-pasarela.md](06-requisitos-pasarela.md)).
5. **Priorizar:** qué es imprescindible para abrir y qué puede esperar (la plantilla de [05-presupuesto.md](05-presupuesto.md) §4 sirve para eso).

**Salida del hito:** acta corta en `docs/reuniones/` con decisiones, cambios pedidos y fecha tentativa de la reunión 2. Los cambios pedidos entran al backlog con prioridad.

### Fase B · Backend real (semanas 3-5)

Se reemplazan los mocks por la base de datos, módulo por módulo. Cada PR trae migración + RLS + prueba de RLS + tipos.

| ID   | Tarea                                                                                                                      | Resp. | Días | Depende |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ------- |
| B-R1 | Rol `salon`, `staff_roles` ampliado, invitaciones, `audit_log`, RLS por rol y sede                                         | **R** | 2.5  | A-R1    |
| B-R2 | `branch_products`, descuento de stock en la RPC de checkout, auto-agotado, revalidación de caché                           | **R** | 3    | A-R2    |
| B-R3 | Realtime de reservas y pedidos, «ya la vi», reconexión, correo al local                                                    | **R** | 1.5  | A-R3    |
| B-R4 | Funciones SQL del dashboard, índices, definición de «venta» documentada                                                    | **R** | 2.5  | A-R4    |
| B-A1 | `dining_tables`, `reservations.ends_at`, `reservation_tables` con exclusión, asignación automática, `uses_tables` por sede | **A** | 5    | A-A1    |
| B-A2 | Conectar plano, lista y alta por teléfono a los datos reales                                                               | **A** | 1.5  | B-A1    |

**Sale de la fase cuando:** ya no queda ningún mock en el panel, todas las políticas RLS nuevas tienen su prueba y hay un conjunto de datos de ejemplo cargado en `berypez-dev`.

### Fase C · Pasarela en sandbox (semanas 3-5, Axel con apoyo de Rafael en pruebas)

| ID   | Tarea                                                                                                          | Resp. | Días | Depende |
| ---- | -------------------------------------------------------------------------------------------------------------- | ----- | ---- | ------- |
| C-A1 | Interfaz `PaymentProvider` + adaptadores `mercadopago` y `mock`; crear cobro desde el pedido                   | **A** | 2.5  | A-A4    |
| C-A2 | Webhook con firma, idempotencia y máquina de estados del pago                                                  | **A** | 2.5  | C-A1    |
| C-A3 | Vencimiento de pedidos con pago pendiente (`pg_cron`) y reembolso desde el panel                               | **A** | 1.5  | C-A2    |
| C-A4 | Casos de prueba de pago en sandbox (aprobado, rechazado, pendiente, duplicado, fuera de orden, monto alterado) | **A** | 2    | C-A2    |
| C-R1 | Casos y E2E de pagos y reembolsos, revisión de seguridad del webhook                                           | **R** | 2    | C-A2    |

**Sale de la fase cuando:** el flujo completo funciona en sandbox, incluidas las fallas, y no se pierde ni se duplica ningún pedido en las pruebas.

### Hito 2 · Pruebas de aceptación con el local (semana 6)

- El equipo del local usa el panel **durante un servicio real o simulado**: recibe una reserva, mueve una mesa, cambia un precio, marca un agotado.
- Lista de verificación firmada por la dueña (sin «observaciones graves» abiertas).

### Fase D · Producción (semanas 6-7)

| ID   | Tarea                                                                                                                                                                 | Resp. | Días | Depende          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ---------------- |
| D-A1 | Adaptador de la pasarela de producción (Izipay o Culqi), credenciales reales, pruebas con montos mínimos                                                              | **A** | 2    | afiliación lista |
| D-A2 | Proyecto de producción en Supabase y Vercel (Pro), dominio, correo con SPF/DKIM/DMARC, copias de respaldo; **apagar el modo demostración del panel (`DEMO_PANEL=0`)** | **A** | 1    | Hito 2           |
| D-R1 | QA completo (E2E, accesibilidad, rendimiento del panel y del sitio) y corrección de lo hallado                                                                        | **R** | 3    | Hito 2           |
| D-R2 | Manual corto para la dueña y el personal + capacitación presencial o por video                                                                                        | **R** | 1    | Hito 2           |

**Sale de la fase cuando:** el primer pedido real pagado de punta a punta se concilia con el abono de la pasarela, y la dueña tiene un manual y un contacto para dudas.

## 3. Resumen de esfuerzo

| Fase                     | Axel      | Rafael    | Total  |
| ------------------------ | --------- | --------- | ------ |
| 0 · Cimientos            | 1.25      | 2.75      | 4      |
| A · Frontend             | 8.5       | 10        | 18.5   |
| B · Backend              | 6.5       | 9.5       | 16     |
| C · Pasarela             | 8.5       | 2         | 10.5   |
| D · Producción           | 3         | 4         | 7      |
| **Total (días-persona)** | **27.75** | **28.25** | **56** |

(P0-02 se cuenta mitad y mitad.) Son **estimaciones con ±30 % de margen**: no hay medición previa de esta clase de trabajo en el proyecto, así que se recalculan al cerrar la fase A con lo que realmente costó.

## 4. Reglas de la planificación

- **Una fase no empieza si la anterior no cumplió su condición de salida**, salvo lo que corre en paralelo según el diagrama (trámite de pasarela, y Axel pasando de B a C).
- **Congelar el alcance tras la reunión 1:** lo que se pida después entra en una lista de «versión 2.1», salvo que sea un error.
- **Demo semanal de 15 min entre nosotros** (viernes): cada uno muestra su módulo funcionando. Es el único chequeo de integración que hace falta con un equipo de dos.
- **Qué hacer con la deuda abierta del MVP** (Lighthouse móvil ≈ 45, issue #58; fotos y alérgenos #25 y #26): no se mezcla con estos módulos. Se agenda aparte para que no frene la v2 ni se olvide.

## 5. Si hay que recortar

Orden sugerido de lo último que se sacrificaría (de lo más a lo menos prescindible):

1. «Elige tu mesa» para el cliente y juntar mesas (ya están fuera o en segunda iteración).
2. Notificaciones push y correo (queda el panel en vivo).
3. Acciones masivas de precios y exportación CSV.
4. Dashboard reducido a «Hoy» y «Platos más pedidos».
5. Plano gráfico → **lista de mesas con estados** (cubre la necesidad central de ver qué mesas están libres).

Lo que **no** se recorta: roles con RLS, descuento de stock dentro de la transacción, restricción anti-choque de mesas y verificación de firma del webhook de pago.
