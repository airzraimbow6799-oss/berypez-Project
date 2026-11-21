# 04 · Reparto del trabajo entre Axel y Rafael

**Regla de oro:** los dos hacen **frontend y backend**. Para que no se estorben, el trabajo se reparte **por módulo completo** (pantalla + base de datos + pruebas), no por capa. Quien se lleva un módulo lo entrega de punta a punta.

## 1. Lo esencial en 30 segundos

- **¿Quién empieza?** Los dos, **el mismo día y en paralelo**. Solo el primer medio día es en conjunto: cerrar juntos los contratos (P0-02).
- **¿Se pueden ir a la par?** Sí, casi todo el plan. Cada uno trabaja en sus módulos y casi nunca espera al otro.
- **¿Dónde sí hay que esperar?** En 4 puntos, listados en la sección 4. El más importante es la **reunión con la dueña (semana 3)**: lo de reservas con plano depende de lo que ella responda.
- **¿Quién termina antes?** Axel termina el frontend en la semana 2 y Rafael en la semana 3. En esa diferencia Axel adelanta la pasarela, que no depende de la dueña.

## 2. Quién se lleva cada módulo

| Módulo                                    | Dueño      | Días | Por qué                                                                                                        |
| ----------------------------------------- | ---------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| 3 · Reservas con plano                    | **Axel**   | 12.5 | Lo más difícil de base de datos (restricción de exclusión, asignación) y de interfaz (editor del plano).       |
| 5 · Pasarela de pagos                     | **Axel**   | 15   | Hizo el ADR 0001 y abre las cuentas de prueba. Incluye 2 días de pruebas de Rafael y 2 de salida a producción. |
| 1 · Login y roles                         | **Rafael** | 4    | Base que usa todo el panel; define `requireStaff` y las políticas RLS por rol.                                 |
| 2 · Panel admin de la carta               | **Rafael** | 6    | Formularios y reglas de datos; se apoya en el catálogo que ya revisó en QA.                                    |
| 4 · Notificaciones en tiempo real         | **Rafael** | 3.5  | Extiende el tablero de pedidos en vivo que ya existe.                                                          |
| 6 · Dashboard                             | **Rafael** | 6    | SQL de agregados y gráficos; los totales se contrastan con los datos que ya conoce.                            |
| Cimientos, QA global, manual y producción | **Ambos**  | 9    | Rafael: panel base, QA y manual. Axel: Vercel, Supabase, dominio y correo.                                     |

**Total:** Axel ≈ 27.75 y Rafael ≈ 28.25 días-persona. Los códigos de tarea (`A-R1`, `B-A1`…) están en [03-plan-de-trabajo.md](03-plan-de-trabajo.md): la letra final dice quién la hace (**A** = Axel, **R** = Rafael).

> Es una propuesta de partida: se ajusta entre los dos según disponibilidad y gustos. Lo importante es que cada módulo tenga **un solo dueño**.

## 3. Calendario semana por semana

Con los dos a tiempo completo (5 días por semana). Si dedican medio tiempo, cada semana vale el doble; el orden no cambia.

| Semana | Axel                                                                                                                                                | Rafael                                                                                                                                                                   | ¿Se esperan?                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **1**  | **P0-02** contratos (mitad, con Rafael) · **P0-04** destrabar Vercel (#62) y texto de pagos (#59) · **A-A1** editor del plano (arranca)             | **P0-01** panel base y `requireStaff` · **P0-02** contratos (mitad, con Axel) · **P0-03** preguntas para la dueña · **A-R1** login y personal · **A-R2** carta (arranca) | Solo en P0-02 (medio día juntos)                                                  |
| **2**  | **A-A1** termina · **A-A2** plano del día y lista · **A-A3** reserva pública · **A-A4** paso de pago en el checkout                                 | **A-R2** carta · **A-R3** notificaciones · **A-R4** dashboard (arranca)                                                                                                  | No, cada uno en lo suyo                                                           |
| **3**  | **C-A1** adaptador de pasarela y crear cobro · **C-A2** webhook con firma (**adelantado**: no depende de la dueña)                                  | **A-R4** dashboard termina · ensayo de la demo · **B-R1** roles reales (arranca)                                                                                         | **Al final: reunión 1 con la dueña** (la demo necesita el front de los dos listo) |
| **4**  | **B-A1** mesas y asignación (ya con las respuestas de la dueña)                                                                                     | **B-R1** termina · **B-R2** stock y precios reales · **B-R3** tiempo real de reservas y pedidos                                                                          | **B-R3** necesita las reservas de Axel (**B-A1**): va al final de la semana       |
| **5**  | **B-A2** conectar el plano · **C-A3** vencimiento y reembolso · **C-A4** pruebas de pago en sandbox                                                 | **B-R4** SQL del dashboard · **C-R1** pruebas de pagos (necesita **C-A2**, hecho en la semana 3)                                                                         | **C-R1** necesita **C-A2** (ya listo)                                             |
| **6**  | **Reunión 2 / pruebas con el local** · **D-A1** pasarela de producción (si la afiliación llegó) · **D-A2** Vercel, Supabase y dominio de producción | **Reunión 2 / pruebas con el local** · **D-R1** QA completo · **D-R2** manual y capacitación                                                                             | **D-A1** espera la afiliación de la dueña                                         |

Notas:

- **Semana 3, Axel:** si la dueña pide cambios grandes en el plano, no se pierde trabajo, porque en esa semana Axel no toca la base de datos de reservas: avanza en la pasarela.
- **Semana 4:** `B-R3` (avisos en vivo de reservas) queda para el final de la semana para que el trabajo de Axel en reservas ya exista.
- **Pasarela de producción (D-A1):** depende del trámite del negocio, que arranca en la reunión 1 (5 a 15 días hábiles según las fuentes). Si se demora, se sale a producción con efectivo y se activa la pasarela después.
- La semana 6 termina con los dos casi sin carga: queda margen (≈ 0.5 días) para imprevistos.

## 4. Los 4 puntos donde uno espera al otro

| #   | Cuándo      | Quién espera            | A quién               | Qué se necesita                                      | Cómo se evita el bloqueo                                                                                |
| --- | ----------- | ----------------------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Día 1       | Ambos                   | Ambos                 | Contratos Zod y borrador de tablas (P0-02)           | Se hacen juntos en medio día; lo demás arranca después.                                                 |
| 2   | Semana 1    | Axel                    | Rafael                | `PanelNav` y `requireStaff` (P0-01)                  | Axel construye su pantalla de forma aislada y agrega su entrada de menú cuando P0-01 esté en `develop`. |
| 3   | Semana 3    | Ambos                   | La dueña              | Respuestas de la reunión 1 (mesas, RUC, quién edita) | Mientras tanto Axel adelanta la pasarela y Rafael termina el dashboard y los roles.                     |
| 4   | Semanas 4-5 | Rafael (`B-R3`, `C-R1`) | Axel (`B-A1`, `C-A2`) | Reservas reales y webhook de pago                    | Rafael pone esas tareas al final de su semana; lo demás no se frena.                                    |

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

- **Tres ramas permanentes:** `develop` (DEV), `qa` y `main` (producción). Las ramas de trabajo se crean desde `develop` (`feat/<módulo>-<tema>`, por ejemplo `feat/plano-editor`) y **se borran al fusionar**.
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
- La restricción de choque de mesas y el webhook de pago los termina quien los empezó, o se hacen en pareja: son lo que más cuesta equivocarse.
- En la fase C, Rafael revisa con Axel el webhook de pago: dos pares de ojos en lo que mueve dinero.
