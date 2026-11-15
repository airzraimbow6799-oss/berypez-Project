# Contrato de la API interna · v1

Mantiene: Axel. Usa: Rafael (casos de prueba y E2E). Todo cambio aquí va acompañado del cambio en `src/types`.

## Convenciones

- Montos en **céntimos enteros** (`priceCents`, `totalCents`): `4250` = S/ 42.50. Nunca decimales.
- Fechas en ISO 8601 con zona horaria (`2026-11-15T13:30:00-05:00`).
- Textos de error en español, pensados para mostrarse al cliente.
- Respuesta estándar:

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

| HTTP | Cuándo                                                   |
| ---- | -------------------------------------------------------- |
| 200  | Lectura o acción correcta.                               |
| 201  | Recurso creado (pedido, reserva, reclamo).               |
| 400  | Datos inválidos (Zod). `error.fields` indica cada campo. |
| 403  | Turnstile inválido o sin permiso.                        |
| 404  | No existe.                                               |
| 409  | Conflicto: precio cambió, plato agotado, sin aforo.      |
| 429  | Límite de peticiones superado.                           |
| 500  | Error interno (sin detalles técnicos al cliente).        |

## Tipos del catálogo (`src/types/catalog.ts`)

| Tipo          | Campos clave                                                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Menu`        | `slug` (`marina`, `criolla`, `berycafe`, `piqueos`, `el-bar`, `vegetariana`), `name`, `description`, `sortOrder`                                                                             |
| `Category`    | `id`, `slug`, `name`, `sortOrder` — sección dentro de una carta (Ceviches, Arroces…)                                                                                                         |
| `Product`     | `id`, `slug`, `name`, `description`, `priceCents` (“desde”), `variantLabel`, `categoryId`, `menus[]`, `image`, `tags`, `allergens`, `portion`, `isAvailable`, `variants[]`, `choiceGroups[]` |
| `Variant`     | `id`, `label`, `priceCents`, `isAvailable`, `selections` (valor fijo por atributo o `null` si se elige libremente)                                                                           |
| `ChoiceGroup` | `key`, `label` (“Elige tu primer acompañamiento”), `options[]` — elección obligatoria que no cambia el precio                                                                                |

Reglas:

- Un producto puede estar en varias cartas (`menus`).
- Si `variants` tiene 2 o más elementos, el cliente debe elegir una (`variantLabel` es el rótulo del selector).
- Para cada `ChoiceGroup`, el cliente elige una opción, salvo que la variante elegida ya fije ese valor en `selections`.
- `image` es `null` cuando el plato no tiene foto (hoy: Dúo vegetariano).

## Endpoints

Estado: 📝 definido · 🚧 en desarrollo · ✅ disponible.

| Método | Ruta                             | Fase  | Estado | Descripción                                       |
| ------ | -------------------------------- | ----- | ------ | ------------------------------------------------- |
| GET    | `/api/menus`                     | F1-02 | 📝     | Las 6 cartas.                                     |
| GET    | `/api/menus/:slug`               | F1-02 | 📝     | Carta con secciones y productos.                  |
| GET    | `/api/products/:slug`            | F1-02 | 📝     | Producto con variantes y grupos de elección.      |
| GET    | `/api/search?q=`                 | F1-03 | 📝     | Búsqueda tolerante a errores y tildes.            |
| GET    | `/api/branches`                  | F2-02 | 📝     | Sedes con horario.                                |
| GET    | `/api/branches/:id/status`       | F2-03 | 📝     | Abierto/cerrado y hora de cierre.                 |
| GET    | `/api/delivery/quote?district=`  | F2-02 | 📝     | Tarifa, tiempo y mínimo del distrito.             |
| POST   | `/api/cart/quote`                | F2-01 | 📝     | Recalcula precios y total desde la base de datos. |
| POST   | `/api/checkout`                  | F2-04 | 📝     | Crea el pedido. Requiere Turnstile.               |
| POST   | `/api/payments`                  | F3-02 | 📝     | Cobra un pedido (monto tomado del servidor).      |
| POST   | `/api/payments/webhook`          | F3-03 | 📝     | Webhook firmado de la pasarela.                   |
| GET    | `/api/orders/:trackingToken`     | F3-04 | 📝     | Estado del pedido para el cliente.                |
| PATCH  | `/api/admin/orders/:id/status`   | F3-04 | 📝     | Cambio de estado (personal autenticado).          |
| GET    | `/api/reservations/availability` | F4-01 | 📝     | Franjas de 30 min con cupo.                       |
| POST   | `/api/reservations`              | F4-01 | 📝     | Crea la reserva. Requiere Turnstile.              |
| PATCH  | `/api/reservations/:id`          | F4-01 | 📝     | Cancelar o reprogramar con `manage_token`.        |
| POST   | `/api/complaints`                | F4-04 | 📝     | Libro de Reclamaciones. Requiere Turnstile.       |

El detalle de cada endpoint (cuerpo, respuesta y errores) se agrega aquí cuando pasa a 🚧.

## Origen de los datos del catálogo

1. `npm run catalog:fetch` — **única** lectura de la API pública de berypez.pe → `data/catalog/raw.json`.
2. `npm run catalog:images` — fotos del snapshot → `public/catalog/<slug>.webp` (WebP 1200×900).
3. `npm run catalog:build` — limpieza (Anexo B) y mapeo a las 6 cartas → `data/catalog/catalog.json`.
   Las reglas viven en `src/features/catalog/import/config.ts`.
