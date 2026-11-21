# Plan de la versión 2 · Berypez

> Documento maestro. Resume el plan completo y enlaza a los detalles. Está pensado para que Axel y Rafael trabajen **ambos en frontend y backend**, y para llevarle a la dueña lo que necesita ver y decidir.

**Estado:** propuesta para revisión del equipo · **Rama:** `docs/plan-v2` · **Base:** `develop` (MVP en curso: carta, carrito, checkout en efectivo, panel de pedidos y reservas por aforo).

## 1. Qué incluye la versión 2

| #   | Módulo                        | Qué resuelve                                                                                                                                    | Detalle                                                                                                        |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Login y roles                 | Personal con cuentas propias y permisos distintos (dueña, cocina, salón).                                                                       | [02-modulos.md §1](02-modulos.md#1-login-y-roles)                                                              |
| 2   | Panel admin de carta          | Cambiar precios, marcar «agotado» y controlar stock de platos, por sede, sin tocar Supabase.                                                    | [02-modulos.md §2](02-modulos.md#2-panel-admin-de-la-carta)                                                    |
| 3   | Reservas centralizadas        | Todas las reservas (web, llamada, WhatsApp) en un solo lugar, con franjas tachadas y límite de terraza; el panel permite reservar por teléfono. | [02-modulos.md §3](02-modulos.md#3-reservas-centralizadas-sin-plano-de-mesas)                                  |
| 4   | Notificaciones en tiempo real | Aviso inmediato en el panel (sonido, contador) cuando entra una reserva o un pedido.                                                            | [02-modulos.md §4](02-modulos.md#4-notificaciones-en-tiempo-real)                                              |
| 5   | Pasarela de pagos             | Cobrar con Yape, Plin y tarjeta, con confirmación automática.                                                                                   | [02-modulos.md §5](02-modulos.md#5-pasarela-de-pagos) y [06-requisitos-pasarela.md](06-requisitos-pasarela.md) |
| 6   | Dashboard                     | Ventas, pedidos, platos más pedidos, reservas y ocupación en una sola pantalla para la dueña.                                                   | [02-modulos.md §6](02-modulos.md#6-dashboard)                                                                  |
| 7   | Cuenta de cliente (opcional)  | Historial de pedidos y reservas y seguimiento con cuenta; hoy el seguimiento ya existe por enlace. Fuera de las estimaciones.                   | [02-modulos.md §7](02-modulos.md#7-cuenta-de-cliente-historial-y-seguimiento-opcional-versión-21)              |

## 2. Índice de documentos

| Archivo                                                | Para qué sirve                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [01-arquitectura.md](01-arquitectura.md)               | Arquitectura, capas, datos nuevos, seguridad y buenas prácticas.                       |
| [02-modulos.md](02-modulos.md)                         | Diseño de cada módulo: pantallas, datos, reglas, riesgos y pruebas.                    |
| [03-plan-de-trabajo.md](03-plan-de-trabajo.md)         | Orden de ejecución: front → reunión con la dueña → back → pasarela. Lista de tareas.   |
| [04-reparto-equipo.md](04-reparto-equipo.md)           | Quién hace qué (cada uno frontend y backend), reglas para no pisarse.                  |
| [05-presupuesto.md](05-presupuesto.md)                 | Costos mensuales de infraestructura, horas de desarrollo y comisiones.                 |
| [06-requisitos-pasarela.md](06-requisitos-pasarela.md) | Qué pide una pasarela peruana, flujo técnico, pruebas y lista para salir a producción. |

## 3. Resumen del plan en 8 puntos

1. **Se construye por módulos verticales.** Cada persona se lleva módulos completos (pantalla + base de datos + pruebas), no «el front» o «el back». Así no hay entregas a medias entre los dos.
2. **Primero el frontend sobre datos simulados.** Se arman las pantallas del panel (carta, reservas, dashboard, notificaciones) con los mocks de MSW que ya existen, para poder enseñárselas a la dueña pronto y barato.
3. **Reunión 1 con la dueña** (final de la fase A): demo en un enlace de Vercel + preguntas que desbloquean decisiones (cupo de terraza, RUC, banco, quién edita la carta).
4. **En esa misma reunión se arranca el trámite de la pasarela.** La afiliación con el proveedor la hace el negocio, no nosotros, y las fuentes consultadas hablan de 5 a 15 días hábiles: es lo que más se demora y no depende de código.
5. **Luego el backend real** (migraciones, RLS, acciones del servidor, Realtime) reemplazando los mocks, módulo por módulo.
6. **Pasarela en sandbox** con Mercado Pago (ya decidido en el [ADR 0001](../decisiones/0001-pasarela-de-pagos.md)) y adaptador `mock` para Plin; producción con Izipay o Culqi según cotización.
7. **Reunión 2 (UAT)** con la dueña probando con su equipo, y recién ahí salida a producción con capacitación.
8. **Todo cambio pasa por PR revisado por la otra persona** y por la CI que ya existe. Nada de lo nuevo se publica sin pruebas del módulo.

## 4. Estimación general

- **≈ 53 días-persona** de desarrollo (con ±30 % de margen), repartidos casi por mitades entre Axel (28.25) y Rafael (24.75). Con dos personas a tiempo completo son **unas 6 a 7 semanas de trabajo efectivo**, más el tiempo de espera de la afiliación de la pasarela.
- **Infraestructura:** unos **US$ 45 al mes** (Vercel Pro 20 + Supabase Pro 25) más el dominio; Resend gratis al inicio. Ver [05-presupuesto.md](05-presupuesto.md).
- **Las tarifas de nuestro trabajo no están en este documento a propósito:** hay una tabla de horas lista para multiplicar por la tarifa que acordemos entre nosotros y con la dueña.

> Todas las cifras de comisiones y de planes son **referenciales** y están fechadas en [05-presupuesto.md](05-presupuesto.md) con su fuente. Se confirman con cotización escrita antes de contratar.

## 5. Decisiones que necesitamos de la dueña

Se llevan a la reunión 1. Cada una cambia el diseño:

1. ¿Cuántas reservas de terraza caben al mismo tiempo por hora, y cuál es el aforo por franja de cada sede?
2. ¿Cuánto dura en promedio una reserva (90 min, 2 h)?
3. ¿Quién va a cambiar precios y marcar agotados: ella, el cocinero, el encargado? ¿Hay platos con stock real (pescado del día) o solo «agotado / disponible»?
4. ¿Tiene RUC activo y cuenta bancaria del negocio? ¿Ya tiene Yape Empresas, POS o cuenta con Izipay, Niubiz o Culqi?
5. ¿Emite boleta o factura electrónica? (Su contador decide cómo; la web no la emite en esta versión.)
6. ¿Cómo quiere enterarse de una reserva nueva: sonido en el panel, correo, WhatsApp?
7. ¿Qué números quiere ver al abrir el dashboard?

## 6. Riesgos principales

| Riesgo                                                                          | Cómo se maneja                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La afiliación de la pasarela tarda y bloquea la salida a producción             | Arrancar el trámite en la reunión 1; salir a producción con efectivo si hace falta y activar el pago después.                                                                                                  |
| Rehacer datos si el front se construye sin un modelo claro                      | Antes del front se cierran los **contratos** (tipos Zod y esquema de tablas) del módulo. Ver [03-plan-de-trabajo.md](03-plan-de-trabajo.md).                                                                   |
| Terraza llena o dos reservas a la vez                                           | Misma función de base de datos para la web y el panel, con bloqueo dentro de la transacción y límite de terraza por franja. Ver [02-modulos.md §3](02-modulos.md#3-reservas-centralizadas-sin-plano-de-mesas). |
| Cuenta de Vercel sin acceso para Rafael (publicación atascada, #62)             | Resolver antes de la fase B; es ajeno al código.                                                                                                                                                               |
| El MVP tiene deuda abierta (Lighthouse móvil ≈ 45, texto de medios de pago #59) | Se trata en paralelo; no se mezcla con los módulos nuevos.                                                                                                                                                     |
| Cifras de comisiones distintas según la fuente                                  | No se promete ningún costo a la dueña hasta tener la cotización escrita.                                                                                                                                       |
