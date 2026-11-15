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
- `image` es `null` cuando el plato no tiene foto (hoy: Dúo vegetariano). Con foto, `url` apunta a Supabase Storage (`…/storage/v1/object/public/catalog/products/<slug>.webp`) y se sirve con `next/image`.
- `MenuSection` = `{ category, products }`; `MenuPage` = `{ menu, menus, sections }`.

## Endpoints

Estado: 📝 definido · 🚧 en desarrollo · ✅ disponible.

| Método | Ruta                             | Fase  | Estado | Descripción                                       |
| ------ | -------------------------------- | ----- | ------ | ------------------------------------------------- |
| GET    | `/api/menus`                     | F1-02 | ✅     | Las 6 cartas.                                     |
| GET    | `/api/menus/:slug`               | F1-02 | ✅     | Carta con secciones y productos.                  |
| GET    | `/api/products/:slug`            | F1-02 | ✅     | Producto con variantes y grupos de elección.      |
| GET    | `/api/search?q=`                 | F1-03 | 📝     | Búsqueda tolerante a errores y tildes.            |
| GET    | `/api/branches`                  | F2-02 | ✅     | Sedes con horario.                                |
| GET    | `/api/branches/:id/status`       | F2-03 | ✅     | Abierto/cerrado y hora de cierre.                 |
| GET    | `/api/delivery/quote?district=`  | F2-02 | ✅     | Tarifa, tiempo y mínimo del distrito.             |
| POST   | `/api/cart/quote`                | F2-01 | ✅     | Recalcula precios y total desde la base de datos. |
| POST   | `/api/checkout`                  | F2-04 | ✅     | Crea el pedido. Requiere Turnstile.               |
| POST   | `/api/payments`                  | F3-02 | 📝     | Cobra un pedido (monto tomado del servidor).      |
| POST   | `/api/payments/webhook`          | F3-03 | 📝     | Webhook firmado de la pasarela.                   |
| GET    | `/api/orders/:trackingToken`     | F3-04 | ✅     | Estado del pedido para el cliente.                |
| PATCH  | `/api/admin/orders/:id/status`   | F3-04 | 📝     | Cambio de estado (personal autenticado).          |
| GET    | `/api/reservations/availability` | F4-01 | 📝     | Franjas de 30 min con cupo.                       |
| POST   | `/api/reservations`              | F4-01 | 📝     | Crea la reserva. Requiere Turnstile.              |
| PATCH  | `/api/reservations/:id`          | F4-01 | 📝     | Cancelar o reprogramar con `manage_token`.        |
| POST   | `/api/complaints`                | F4-04 | 📝     | Libro de Reclamaciones. Requiere Turnstile.       |

El detalle de cada endpoint (cuerpo, respuesta y errores) se agrega aquí cuando pasa a 🚧.

### Catálogo (F1-02) ✅

Lecturas públicas con caché: `unstable_cache`, etiqueta `catalog` y revalidación cada 10 min. Además, `POST /api/revalidate` se dispara al editar en Supabase.

| Endpoint                  | Respuesta `data`                                                                                                    | Errores                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /api/menus`          | `Menu[]` ordenadas por `sortOrder`                                                                                  | 500 `catalog_unavailable`                                                   |
| `GET /api/menus/:slug`    | `MenuPage`: `{ menu, menus, sections: [{ category, products }] }`; solo productos publicados y sin secciones vacías | 404 `menu_not_found` (también si `slug` no es una de las 6 cartas) · 500    |
| `GET /api/products/:slug` | `Product` con `variants` y `choiceGroups`                                                                           | 400 `invalid_slug` (solo `a-z`, `0-9`, `-`) · 404 `product_not_found` · 500 |

```http
GET /api/menus/marina
200 { "success": true, "data": { "menu": { "slug": "marina", … }, "menus": [ … ], "sections": [ { "category": { "slug": "ceviches", … }, "products": [ … ] } ] } }
```

### Revalidación (interno)

`POST /api/revalidate` con la cabecera `x-revalidate-secret`. Lo llama un trigger de Postgres (`pg_net`) después de cada `insert`, `update` o `delete` en `products`, `variants`, `product_menus`, `categories` o `menus`: una sola llamada por sentencia. La URL y el secreto están en Supabase Vault (`catalog_revalidate_url`, `catalog_revalidate_secret`) y el secreto también en `REVALIDATE_SECRET` de Vercel.

| Respuesta                        | Cuándo                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| 200 `{ revalidated: "catalog" }` | Secreto correcto.                                                   |
| 401 `unauthorized`               | Falta el secreto o es incorrecto (comparación en tiempo constante). |
| 503 `not_configured`             | El servidor no tiene `REVALIDATE_SECRET`.                           |

## Origen de los datos del catálogo

1. `npm run catalog:fetch` — **única** lectura de la API pública de berypez.pe → `data/catalog/raw.json`.
2. `npm run catalog:images` — fotos del snapshot → `public/catalog/<slug>.webp` (WebP 1200×900).
3. `npm run catalog:build` — limpieza (Anexo B) y mapeo a las 6 cartas → `data/catalog/catalog.json`.
   Las reglas viven en `src/features/catalog/import/config.ts`.

### Pedidos (F2) ✅

| Endpoint                         | Cuerpo / respuesta                                                                                                                                                                                                                                                   | Errores                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/branches`              | `{ branches: [{ slug, name, whatsapp, status: { isOpen, label }, openingHours }], zones: [{ district, feeCents, minOrderCents, etaMinutes }] }`. El estado abierto/cerrado de `/api/branches/:id/status` y la tarifa de `/api/delivery/quote` vienen incluidos aquí. | 500                                                                                                                                                             |
| `POST /api/cart/quote`           | `{ items: [{ productId, variantId, quantity, choices, note }], modality, branchSlug, district }` → `{ lines, subtotalCents, deliveryCents, totalCents, missingForMinimumCents, issues, etaMinutes }`. **Los precios salen de la base.**                              | 400 · 429 (120 cada 10 min por IP) · 500                                                                                                                        |
| `POST /api/checkout`             | Esquema en `features/checkout/schema.ts`. 201 → `{ orderId, trackingToken, totalCents }`. Pedido y líneas en una transacción (`checkout_create_order`).                                                                                                              | 400 `invalid_input` con `fields` · 403 `turnstile_failed` · 409 `closed` / `cart_changed` / `below_minimum` · 429 (10 por IP y 5 por celular cada 10 min) · 500 |
| `GET /api/orders/:trackingToken` | Pedido con líneas y sede.                                                                                                                                                                                                                                            | 404 (incluye tokens que no son UUID) · 500                                                                                                                      |

En la Fase 2 solo se acepta `paymentMethod: "cash"`. Yape, Plin y tarjeta responden 400 hasta la Fase 3.
