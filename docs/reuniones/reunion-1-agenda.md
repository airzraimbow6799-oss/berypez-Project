# Reunión 1 con la dueña · Agenda y preguntas (P0-03)

**Objetivo:** que la dueña vea las pantallas del panel con datos de ejemplo, que responda lo que bloquea el diseño y que arranque el trámite de la pasarela.
**Cuándo:** al final de la fase A (semana 3 del [plan de trabajo](../plan/03-plan-de-trabajo.md)). **Duración:** 60 a 90 minutos, en el local si se puede.
**Quién dirige:** quien tenga el módulo central de la demo; la otra persona toma notas en el acta.

## Antes de la reunión

- [ ] Enlace de Vercel (vista previa) con las pantallas listas, probado en un celular y en escritorio.
- [ ] Los datos de ejemplo están marcados como «datos de ejemplo» en pantalla.
- [ ] Una foto del salón y de dónde queda la terraza (no hace falta dibujar mesas).
- [ ] Lista de documentos para la pasarela impresa o en el chat ([06-requisitos-pasarela.md](../plan/06-requisitos-pasarela.md) §2).

## Agenda

| Min   | Qué                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-20  | **Demo guiada:** carta (precios y agotados), reservas (con «Nueva reserva» por teléfono), aviso de reserva en vivo, dashboard, pago en el checkout. |
| 20-40 | **Que lo toque ella** con su celular. Anotar dónde duda o se equivoca, sin explicar antes.                                                          |
| 40-70 | **Preguntas de decisión** (siguiente sección).                                                                                                      |
| 70-80 | **Trámite de la pasarela:** qué documentos faltan y quién los junta.                                                                                |
| 80-90 | **Prioridades:** qué es imprescindible para abrir y qué puede esperar (escalones de [05-presupuesto.md](../plan/05-presupuesto.md) §4).             |

## Preguntas de decisión

Cada una dice **qué módulo desbloquea**. Dejar la respuesta escrita.

### Reservas (bloquean el módulo)

| #   | Pregunta                                                                            | Respuesta |
| --- | ----------------------------------------------------------------------------------- | --------- |
| 1   | ¿Cuántas reservas de terraza caben al mismo tiempo por hora? ¿Y de interior?        |           |
| 2   | ¿Cuál es el aforo por franja de cada sede? (hoy figura 40 personas)                 |           |
| 3   | ¿Cuánto dura en promedio una reserva (90 min, 2 h)? ¿Cuánto tarda la limpieza?      |           |
| 4   | ¿Cuántos minutos esperan a una reserva que no llega antes de liberar el cupo?       |           |
| 5   | ¿Quiénes registrarán las reservas por llamada y WhatsApp? ¿Piden siempre el correo? |           |

### Carta (bloquean precios y stock)

| #   | Pregunta                                                                                          | Respuesta |
| --- | ------------------------------------------------------------------------------------------------- | --------- |
| 6   | ¿Quién va a cambiar precios y marcar agotados: ella, el cocinero, el encargado?                   |           |
| 7   | ¿Hay platos con cantidad limitada real (pescado del día, postres) o basta «agotado / disponible»? |           |
| 8   | ¿El stock se reinicia cada día? ¿A qué hora?                                                      |           |
| 9   | ¿Los precios son iguales en las dos sedes?                                                        |           |

### Personal y roles

| #   | Pregunta                                                                      | Respuesta |
| --- | ----------------------------------------------------------------------------- | --------- |
| 10  | ¿Quiénes van a entrar al panel y con qué rol (administración, cocina, salón)? |           |
| 11  | ¿Cada persona atiende una sola sede o varias?                                 |           |

### Avisos y dashboard

| #   | Pregunta                                                                                         | Respuesta |
| --- | ------------------------------------------------------------------------------------------------ | --------- |
| 12  | ¿Cómo quiere enterarse de una reserva nueva: sonido en el panel, correo, WhatsApp?               |           |
| 13  | ¿Qué números mira hoy (cuaderno, Excel, caja)? ¿Cuáles quiere ver primero al abrir el dashboard? |           |

### Pagos (bloquean la pasarela)

| #   | Pregunta                                                                                    | Respuesta |
| --- | ------------------------------------------------------------------------------------------- | --------- |
| 14  | ¿Tiene RUC activo? ¿A nombre de quién?                                                      |           |
| 15  | ¿Tiene cuenta bancaria del negocio para recibir los abonos?                                 |           |
| 16  | ¿Ya tiene Yape Empresas, un POS o cuenta con Izipay, Niubiz o Culqi?                        |           |
| 17  | ¿Quiere cobrar en línea desde el primer día o abrir con efectivo y activar el pago después? |           |
| 18  | ¿Cómo emite sus boletas o facturas electrónicas? (lo ve con su contador)                    |           |
| 19  | ¿Quién firma el contrato con el proveedor?                                                  |           |

### Sistema del local (ticketera y facturación)

| #   | Pregunta                                                                                            | Respuesta |
| --- | --------------------------------------------------------------------------------------------------- | --------- |
| 20  | ¿Cómo se llama exactamente el sistema del local (Trinetsoft?) y quién es el contacto del proveedor? |           |
| 21  | ¿Quiere que los pedidos de la web lleguen solos a la ticketera de cocina?                           |           |
| 22  | ¿Las reservas también deben registrarse en ese sistema?                                             |           |
| 23  | ¿Quién emite la boleta o factura: el sistema al cerrar la cuenta? (la web no emite comprobantes)    |           |

## Acta (completar durante la reunión)

- **Fecha y asistentes:**
- **Decisiones tomadas:**
- **Cambios pedidos a lo que vio** (con prioridad alta / media / baja):
- **Tareas del trámite de la pasarela** (quién, qué, para cuándo):
- **Fecha tentativa de la reunión 2:**

Al terminar se guarda el acta completa como `docs/reuniones/reunion-1-acta.md`, y los cambios pedidos pasan a issues con su prioridad. El alcance se congela: lo que se pida después va a la «versión 2.1», salvo que sea un error.
