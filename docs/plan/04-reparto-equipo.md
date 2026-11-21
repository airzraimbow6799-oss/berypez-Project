# 04 · Reparto del trabajo entre Axel y Rafael

**Regla de oro:** los dos hacen **frontend y backend**. Para que eso no genere choques, el trabajo se reparte **por módulo completo** (pantalla + base de datos + pruebas), no por capa. Quien se lleva un módulo lo entrega de punta a punta y es su «dueño» ante el otro y ante la dueña del restaurante.

## 1. Quién se lleva qué

| Módulo                                              | Dueño                                                                    | Por qué                                                                                                                                                                        | Días (aprox.) |
| --------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 3 · Reservas con plano                              | **Axel**                                                                 | La parte más difícil de base de datos (restricción de exclusión, asignación de mesas) y de interfaz (editor del plano). Las migraciones iniciales del MVP las hizo él (F0-06). | 12.5          |
| 5 · Pasarela de pagos                               | **Axel**                                                                 | Él hizo el ADR 0001 y es quien abre las cuentas de prueba del proveedor. Incluye las pruebas de Rafael (2 d) y la salida a producción (2 d).                                   | 15            |
| 1 · Login y roles                                   | **Rafael**                                                               | Base que usa todo el panel; define `requireStaff` y las políticas RLS por rol.                                                                                                 | 4             |
| 2 · Panel admin de la carta                         | **Rafael**                                                               | Mucho formulario y reglas de datos; se apoya en el catálogo que ya revisó en QA (F0-Q4).                                                                                       | 6             |
| 4 · Notificaciones en tiempo real                   | **Rafael**                                                               | Extiende el tablero de pedidos en vivo que ya existe; pequeño y bien acotado.                                                                                                  | 3.5           |
| 6 · Dashboard                                       | **Rafael**                                                               | SQL de agregados + gráficos; los totales se contrastan con los datos que ya conoce.                                                                                            | 6             |
| Cimientos, QA global, manual y puesta en producción | **Ambos** (Rafael: QA y manual; Axel: Vercel, Supabase, dominio, correo) | Es el rol natural de cada uno.                                                                                                                                                 | 9             |

Resultado: **Axel ≈ 27.75 y Rafael ≈ 28.25 días-persona** (cuadro completo en [03-plan-de-trabajo.md](03-plan-de-trabajo.md) §3). Si uno de los dos tiene menos horas por semana, se mueve el módulo de **notificaciones** o el de **dashboard** al otro; son los más independientes.

> Esto es una propuesta de partida: se ajusta en una conversación entre los dos según disponibilidad y gustos. Lo importante es que cada módulo tenga **un solo dueño**.

## 2. Cómo no pisarse

### Archivos y zonas compartidas

| Zona compartida                        | Quién la mantiene              | Cómo se toca                                                                                                                                                                |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PanelNav.tsx`, layout del panel       | Rafael                         | Axel agrega su entrada de menú con un PR chico, o se la pide a Rafael.                                                                                                      |
| `requireStaff` y `src/features/staff/` | Rafael                         | Axel lo usa, no lo cambia sin avisar.                                                                                                                                       |
| `supabase/migrations/`                 | Quien la crea                  | **Una migración por PR y se avisa por el chat antes de crearla.** Los nombres llevan fecha-hora, así que no chocan; el riesgo es que dos migraciones toquen la misma tabla. |
| `src/types/database.ts` (generado)     | Quien migra                    | Se regenera siempre en el mismo PR de la migración; ante un conflicto se vuelve a generar, no se edita a mano.                                                              |
| `src/features/orders`, `reservations`  | Dueño del módulo que lo cambia | Cambios en el otro módulo se acuerdan primero.                                                                                                                              |
| `docs/`, `.env.example`                | Ambos                          | Cada PR actualiza lo que cambia.                                                                                                                                            |

Se agrega un archivo `.github/CODEOWNERS` con los dueños de cada carpeta; GitHub los pone como revisores automáticamente.

### Ramas y PR

- Ramas `feat/<módulo>-<tema>` desde `develop`: por ejemplo `feat/plano-editor`, `feat/carta-stock`.
- **PR pequeños**, de a una idea, para revisarlos en menos de 20 minutos. Si un PR pasa de ~400 líneas sin contar archivos generados, se parte.
- **Siempre lo revisa la otra persona.** Así cada uno conoce el módulo del otro y hay un respaldo si alguien no puede continuar. La revisión mira: ¿respeta el rol?, ¿hay prueba de RLS?, ¿qué pasa si falla?
- Se mantiene el flujo vigente: `feat/*` → `develop` → release → `main`, con CI verde.

### Contratos primero

Antes de que alguien consuma el módulo del otro (por ejemplo, Rafael mostrando reservas en el dashboard), existe el esquema Zod y el tipo en `schema.ts`. Si cambia, se avisa en el PR y se actualizan los dos lados en el mismo cambio.

## 3. Ritmo de trabajo

| Cuándo          | Qué                                                                                                                    | Tiempo    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| Lunes           | Mini planificación: qué tareas de [03-plan-de-trabajo.md](03-plan-de-trabajo.md) toma cada uno esta semana.            | 15 min    |
| Cada día (chat) | Mensaje corto: qué hice, qué haré, qué me bloquea.                                                                     | 2 min     |
| Viernes         | Demo cruzada: cada uno muestra su módulo funcionando; se corrige el plan si hace falta.                                | 15-30 min |
| Cada hito       | Reunión con la dueña (preparada y dirigida por quien tenga el módulo central de esa demo; la otra persona toma notas). | 60-90 min |

Tablero: un **GitHub Project** (o los issues con etiquetas `modulo:*` y `fase:*`) con una columna por estado. Cada tarea de [03-plan-de-trabajo.md](03-plan-de-trabajo.md) se convierte en un issue con su ID (`A-R2`, `B-A1`…).

## 4. Qué aprende cada quien (para que «ambos hagan todo» no sea solo frase)

- **Rafael**, que viene de QA: hace de punta a punta módulos con interfaz y SQL, y aplica ahí su criterio de pruebas. Cuida que cada módulo del otro también se pueda probar.
- **Axel**, que armó el esquema y la base del MVP: lleva el módulo de interfaz más exigente (el plano) para que también practique frontend a fondo.
- En la fase C, Rafael hace pareja de revisión con Axel en el webhook de pago: **dos pares de ojos en lo que mueve dinero**.

## 5. Si alguien se atrasa o se enferma

- El dueño del módulo deja siempre su **estado en el issue** (qué está hecho, qué falta, cómo probarlo).
- El otro puede continuar porque revisó los PR y conoce el código.
- Lo que no se mueve si hay que reasignar: la restricción de choque de mesas y el webhook de pago los termina quien los empezó, o se hacen en pareja.
