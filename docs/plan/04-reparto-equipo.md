# 04 · Reparto del trabajo entre Axel y Rafael

**Regla de oro:** los dos hacen **frontend y backend**. Para que no se estorben, el trabajo se reparte **por módulo completo** (pantalla + base de datos + pruebas), no por capa. Quien se lleva un módulo lo entrega de punta a punta.

## 1. Lo esencial en 30 segundos

- **¿Quién empieza?** Los dos, **el mismo día y en paralelo**. Solo el primer medio día es en conjunto: cerrar juntos los contratos (P0-02).
- **¿Se pueden ir a la par?** Sí, casi todo el plan. Cada uno trabaja en sus módulos y casi nunca espera al otro.
- **¿Dónde sí hay que esperar?** En 4 puntos, listados en la sección 4. El más importante es la **reunión con la dueña (semana 3)**: lo de reservas (cupo de terraza) depende de lo que ella responda.
- **¿Quién termina antes?** Axel termina el frontend en la semana 2 y Rafael en la semana 3. En esa diferencia Axel adelanta la pasarela, que no depende de la dueña.

## 2. Quién se lleva cada módulo

| Módulo                                    | Dueño      | Días | Por qué                                                                                                                                    |
| ----------------------------------------- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 3 · Reservas centralizadas                | **Axel**   | 9.5  | Lo más delicado de base de datos (cupo de terraza dentro de la transacción) y el correo de confirmación; ya conoce el esquema de reservas. |
| 5 · Pasarela de pagos                     | **Axel**   | 15   | Hizo el ADR 0001 y abre las cuentas de prueba. Incluye 2 días de pruebas de Rafael y 2 de salida a producción.                             |
| 1 · Login y roles                         | **Rafael** | 4    | Base que usa todo el panel; define `requireStaff` y las políticas RLS por rol.                                                             |
| 2 · Panel admin de la carta               | **Rafael** | 6    | Formularios y reglas de datos; se apoya en el catálogo que ya revisó en QA.                                                                |
| 4 · Notificaciones en tiempo real         | **Axel**   | 3.5  | Nacen de las reservas que él construye y extienden el tablero en vivo que ya existe.                                                       |
| 6 · Dashboard                             | **Rafael** | 6    | SQL de agregados y gráficos; los totales se contrastan con los datos que ya conoce.                                                        |
| Cimientos, QA global, manual y producción | **Ambos**  | 9    | Rafael: panel base, QA y manual. Axel: Vercel, Supabase, dominio y correo.                                                                 |

**Total:** Axel ≈ 28.25 y Rafael ≈ 24.75 días-persona. Los códigos de tarea (`A-R1`, `B-A1`…) están en [03-plan-de-trabajo.md](03-plan-de-trabajo.md): la letra final dice quién la hace (**A** = Axel, **R** = Rafael).

> Es una propuesta de partida: se ajusta entre los dos según disponibilidad y gustos. Lo importante es que cada módulo tenga **un solo dueño**.

## 3. Calendario semana por semana

Con los dos a tiempo completo (5 días por semana). Si dedican medio tiempo, cada semana vale el doble; el orden no cambia.

| Semana | Axel                                                                                                                                                                        | Rafael                                                                                                                                                                   | ¿Se esperan?                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **1**  | **P0-02** contratos (mitad, con Rafael) · **P0-04** destrabar Vercel (#62) y texto de pagos (#59) · **A-A1** «Nueva reserva» en el panel · **A-A2** vista del día (arranca) | **P0-01** panel base y `requireStaff` · **P0-02** contratos (mitad, con Axel) · **P0-03** preguntas para la dueña · **A-R1** login y personal · **A-R2** carta (arranca) | Solo en P0-02 (medio día juntos)                                                  |
| **2**  | **A-A2** termina · **A-A3** reserva pública con franjas tachadas · **A-A4** paso de pago en el checkout · **A-A5** notificaciones (arranca)                                 | **A-R2** carta · **A-R4** dashboard                                                                                                                                      | No, cada uno en lo suyo                                                           |
| **3**  | **A-A5** termina · **C-A1** adaptador de pasarela · **C-A2** webhook con firma (**adelantado**: no depende de la dueña)                                                     | **A-R4** dashboard termina · ensayo de la demo · **B-R1** roles reales · **B-R2** stock y precios reales (arranca)                                                       | **Al final: reunión 1 con la dueña** (la demo necesita el front de los dos listo) |
| **4**  | **C-A2** termina · **B-A1** cupo de terraza y alta desde el panel (ya con las respuestas de la dueña) · **B-A2** correo de confirmación (arranca)                           | **B-R2** termina · **B-R4** SQL del dashboard · **C-R1** pruebas de pagos (arranca)                                                                                      | **C-R1** necesita **C-A2** (ya listo)                                             |
| **5**  | **B-A2** termina · **B-A3** avisos en vivo de reservas · **C-A3** vencimiento y reembolso · **C-A4** pruebas de pago en sandbox                                             | **C-R1** termina · **D-R1** QA completo · **D-R2** manual y capacitación                                                                                                 | **B-A3** necesita **B-A1**                                                        |
| **6**  | **Reunión 2 / pruebas con el local** · **D-A1** pasarela de producción (si la afiliación llegó) · **D-A2** Vercel, Supabase y dominio de producción                         | **Reunión 2 / pruebas con el local** · ajustes de lo que pida la dueña                                                                                                   | **D-A1** espera la afiliación de la dueña                                         |

Notas:

- **Semana 3, Axel:** si la dueña pide cambios en las reservas, no se pierde trabajo, porque en esa semana Axel no toca la base de datos de reservas: avanza en la pasarela.
- **Semanas 4-5:** `B-A3` (avisos en vivo de reservas) va después de `B-A1` porque necesita las reservas reales.
- **Pasarela de producción (D-A1):** depende del trámite del negocio, que arranca en la reunión 1 (5 a 15 días hábiles según las fuentes). Si se demora, se sale a producción con efectivo y se activa la pasarela después.
- La semana 6 queda con margen para lo que pida la dueña en la reunión 2 y para imprevistos.

## 4. Los 4 puntos donde uno espera al otro

| #   | Cuándo   | Quién espera    | A quién       | Qué se necesita                                                | Cómo se evita el bloqueo                                                                                |
| --- | -------- | --------------- | ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Día 1    | Ambos           | Ambos         | Contratos Zod y borrador de tablas (P0-02)                     | Se hacen juntos en medio día; lo demás arranca después.                                                 |
| 2   | Semana 1 | Axel            | Rafael        | `PanelNav` y `requireStaff` (P0-01)                            | Axel construye su pantalla de forma aislada y agrega su entrada de menú cuando P0-01 esté en `develop`. |
| 3   | Semana 3 | Ambos           | La dueña      | Respuestas de la reunión 1 (cupo de terraza, RUC, quién edita) | Mientras tanto Axel adelanta la pasarela y Rafael termina el dashboard y los roles.                     |
| 4   | Semana 4 | Rafael (`C-R1`) | Axel (`C-A2`) | Webhook de pago                                                | Rafael pone esa tarea al final de su semana; lo demás no se frena.                                      |

Fuera de esos cuatro, el trabajo es independiente.

## 5. Cómo no pisarse

### Zonas compartidas

| Zona                                  | Quién la mantiene | Cómo se toca                                                                                                                                             |
| ------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PanelNav.tsx`, layout del panel      | Rafael            | Axel agrega su entrada de menú con un PR chico, o se la pide a Rafael.                                                                                   |
| `requireStaff`, `src/features/staff/` | Rafael            | Axel lo usa; si hay que cambiarlo, se avisa antes.                                                                                                       |
| `supabase/migrations/`                | Quien la crea     | **Una migración por PR y se avisa por el chat antes de crearla.** El riesgo no es el nombre del archivo, sino que dos migraciones toquen la misma tabla. |
| `src/types/database.ts` (generado)    | Quien migra       | Se regenera siempre en el mismo PR de la migración; ante un conflicto se vuelve a generar, no se edita a mano.                                           |
| `src/features/orders`, `reservations` | Dueño del módulo  | Cambios en el módulo del otro se acuerdan primero.                                                                                                       |
| `docs/`, `.env.example`               | Ambos             | Cada PR actualiza lo que cambia.                                                                                                                         |

Se agrega `.github/CODEOWNERS` con el dueño de cada carpeta, para que GitHub ponga al revisor correcto.

### Ramas y PR

- **Tres ramas permanentes:** `develop` (DEV), `qa` y `main` (producción). Las ramas de trabajo se crean desde `develop` (`feat/<módulo>-<tema>`, por ejemplo `feat/reservas-nueva`) y **se borran al fusionar**.
- **PR pequeños**, de una sola idea, que se puedan revisar en menos de 20 minutos. Si pasa de unas 400 líneas sin contar archivos generados, se parte.
- **Siempre lo revisa la otra persona.** Así cada uno conoce el módulo del otro y hay respaldo si alguien no puede continuar. Se mira: ¿respeta el rol?, ¿hay prueba de RLS?, ¿qué pasa si falla?
- Flujo: `feat/*` → `develop` → `qa` → `main`, con la CI en verde.

### Contratos primero

Antes de que alguien use el módulo del otro (por ejemplo, el dashboard mostrando reservas) existe el esquema Zod y el tipo en `schema.ts`. Si cambia, se avisa en el PR y se actualizan los dos lados en el mismo cambio.

## 6. Ritmo de trabajo

| Cuándo          | Qué                                                                                             | Tiempo    |
| --------------- | ----------------------------------------------------------------------------------------------- | --------- |
| Lunes           | Mini planificación: qué tareas de la tabla de la sección 3 toma cada uno esta semana.           | 15 min    |
| Cada día (chat) | Mensaje corto: qué hice, qué haré, qué me bloquea.                                              | 2 min     |
| Viernes         | Demo cruzada: cada uno muestra su módulo funcionando.                                           | 15-30 min |
| Cada hito       | Reunión con la dueña; la dirige quien tenga el módulo central de esa demo y el otro toma notas. | 60-90 min |

Tablero: un **GitHub Project** (o issues con etiquetas `modulo:*` y `fase:*`) donde cada tarea de [03-plan-de-trabajo.md](03-plan-de-trabajo.md) es un issue con su código.

## 7. Si alguien se atrasa o se enferma

- El dueño del módulo deja siempre el **estado en el issue**: qué está hecho, qué falta y cómo probarlo.
- El otro puede continuar porque revisó los PR y conoce el código.
- La validación de cupo de reservas y el webhook de pago los termina quien los empezó, o se hacen en pareja: son lo que más cuesta equivocarse.
- En la fase C, Rafael revisa con Axel el webhook de pago: dos pares de ojos en lo que mueve dinero.
