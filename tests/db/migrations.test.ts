// @vitest-environment node
/**
 * F0-06 · Aplica las migraciones en Postgres (PGlite, sin Docker) y verifica RLS y reglas.
 * Emula lo mínimo de Supabase: roles anon/authenticated, esquema auth y auth.uid().
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS_DIR = path.resolve("supabase/migrations");
const STAFF_LINCE = "11111111-1111-1111-1111-111111111111";
const STAFF_JM = "22222222-2222-2222-2222-222222222222";

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

const SEED = `
  insert into menus (slug, name, sort_order) values ('marina', 'Carta Marina', 1);
  insert into categories (id, slug, name, sort_order) values (73, 'ceviches', 'Ceviches', 1);
  insert into products (id, slug, name, price_cents, category_id) values (1, 'ceviche', 'Ceviche', 4500, 73);
  insert into products (id, slug, name, price_cents, category_id, is_published)
    values (2, 'oculto', 'Oculto', 1000, 73, false);
  -- Las sedes (1 = Lince, 2 = Jesús María) las crea la migración de datos 0800.
  insert into auth.users (id) values ('${STAFF_LINCE}'), ('${STAFF_JM}');
  insert into staff_roles (user_id, role, branch_id) values ('${STAFF_LINCE}', 'cocina', 1), ('${STAFF_JM}', 'cocina', 2);
  insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method)
    values (1, 'pickup', 'Ana', '987654321', 4500, 4500, 'cash'),
           (2, 'pickup', 'Luis', '987654322', 4500, 4500, 'cash');
`;

let db: PGlite;

async function as<T>(role: "anon" | "authenticated", userId: string | null, sql: string) {
  await db.exec(
    `set role ${role}; select set_config('request.jwt.claim.sub', '${userId ?? ""}', false);`,
  );
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec("reset role;");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(path.join(MIGRATIONS_DIR, file), "utf8"));
  }
  await db.exec(SEED);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe("RLS", () => {
  it("activa RLS en todas las tablas de public", async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(rows).toEqual([]);
  });

  it("no deja funciones SECURITY DEFINER en el esquema expuesto public", async () => {
    const { rows } = await db.query<{ proname: string }>(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef`,
    );
    expect(rows).toEqual([]);
  });

  it("anon lee solo productos publicados", async () => {
    const { rows } = await as<{ id: number }>("anon", null, "select id from products order by id");
    expect(rows.map((r) => Number(r.id))).toEqual([1]);
  });

  it("anon no puede leer ni crear pedidos", async () => {
    const { rows } = await as("anon", null, "select * from orders");
    expect(rows).toEqual([]);
    await expect(
      as(
        "anon",
        null,
        `insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method)
         values (1, 'pickup', 'Bot', '987654321', 1, 1, 'cash')`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("anon no puede leer reclamos, pagos ni roles", async () => {
    for (const table of [
      "complaints",
      "payment_events",
      "staff_roles",
      "reservations",
      "email_log",
    ]) {
      const { rows } = await as("anon", null, `select * from ${table}`);
      expect(rows, table).toEqual([]);
    }
  });

  it("el personal ve solo los pedidos de su sede", async () => {
    const { rows } = await as<{ customer_name: string }>(
      "authenticated",
      STAFF_LINCE,
      "select customer_name from orders",
    );
    expect(rows.map((r) => r.customer_name)).toEqual(["Ana"]);
  });

  it("el personal cambia el estado pero no el total", async () => {
    await as(
      "authenticated",
      STAFF_LINCE,
      "update orders set status = 'in_kitchen' where customer_name = 'Ana'",
    );
    const { rows } = await db.query<{ status: string }>(
      "select status from orders where customer_name = 'Ana'",
    );
    expect(rows[0]?.status).toBe("in_kitchen");

    await expect(
      as(
        "authenticated",
        STAFF_LINCE,
        "update orders set total_cents = 1 where customer_name = 'Ana'",
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("el personal no modifica pedidos de otra sede", async () => {
    await as(
      "authenticated",
      STAFF_LINCE,
      "update orders set status = 'delivered' where customer_name = 'Luis'",
    );
    const { rows } = await db.query<{ status: string }>(
      "select status from orders where customer_name = 'Luis'",
    );
    expect(rows[0]?.status).toBe("pending");
  });
});

describe("checkout (F2)", () => {
  const order = (extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      branch_id: 1,
      modality: "pickup",
      customer_name: "Rosa",
      customer_phone: "987654321",
      subtotal_cents: 9000,
      delivery_cents: 0,
      total_cents: 9000,
      payment_method: "cash",
      ...extra,
    });
  const items = JSON.stringify([
    {
      product_id: 1,
      product_name: "Ceviche",
      quantity: 2,
      unit_price_cents: 4500,
      line_total_cents: 9000,
    },
  ]);

  it("las sedes y los 7 distritos de reparto quedan cargados a S/ 7.50", async () => {
    const { rows } = await db.query<{ n: number; fee: number }>(
      "select count(*)::int as n, min(fee_cents) as fee from delivery_zones",
    );
    expect(rows[0]).toEqual({ n: 7, fee: 750 });
  });

  it("crea el pedido y sus líneas en una sola operación", async () => {
    const { rows } = await db.query<{ order_id: number; tracking_token: string }>(
      `select * from checkout_create_order('${order()}'::jsonb, '${items}'::jsonb)`,
    );
    const id = rows[0]?.order_id;
    const { rows: lines } = await db.query<{ n: number }>(
      `select count(*)::int as n from order_items where order_id = ${id}`,
    );
    expect(lines[0]?.n).toBe(1);
    expect(rows[0]?.tracking_token).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("no crea nada si el subtotal no coincide con las líneas", async () => {
    const before = await db.query<{ n: number }>("select count(*)::int as n from orders");
    await expect(
      db.query(
        `select * from checkout_create_order('${order({ subtotal_cents: 1, total_cents: 1 })}'::jsonb, '${items}'::jsonb)`,
      ),
    ).rejects.toThrow(/subtotal no coincide/);
    const after = await db.query<{ n: number }>("select count(*)::int as n from orders");
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });

  it("anon no puede crear pedidos ni tocar el límite de peticiones", async () => {
    await expect(
      as(
        "anon",
        null,
        `select * from checkout_create_order('${order()}'::jsonb, '${items}'::jsonb)`,
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "select checkout_hit_rate_limit('x', 1, 60)")).rejects.toThrow(
      /permission denied/,
    );
  });

  it("el límite de peticiones corta después de N intentos en la ventana", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i += 1) {
      const { rows } = await db.query<{ ok: boolean }>(
        "select checkout_hit_rate_limit('ip:1.2.3.4', 3, 600) as ok",
      );
      results.push(rows[0]?.ok ?? false);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("flujo de estados (F3-04)", () => {
  const setStatus = (name: string, status: string) =>
    as(
      "authenticated",
      STAFF_LINCE,
      `update orders set status = '${status}' where customer_name = '${name}'`,
    );

  it("el personal no puede saltar pasos", async () => {
    await db.exec(
      `insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method)
       values (1, 'pickup', 'Flujo', '987654323', 100, 100, 'cash')`,
    );
    await expect(setStatus("Flujo", "delivered")).rejects.toThrow(/no permitido/);
  });

  it("avanza paso a paso y no usa estados de la otra modalidad", async () => {
    await setStatus("Flujo", "in_kitchen");
    await expect(setStatus("Flujo", "on_the_way")).rejects.toThrow(/no permitido/);
    await setStatus("Flujo", "ready_for_pickup");
    await expect(setStatus("Flujo", "cancelled")).rejects.toThrow(/no permitido/);
    await setStatus("Flujo", "delivered");
    const { rows } = await db.query<{ status: string }>(
      "select status from orders where customer_name = 'Flujo'",
    );
    expect(rows[0]?.status).toBe("delivered");
  });
});

describe("reservas (F4-01/F4-02)", () => {
  const reserve = (party: number, startsAt = "2026-11-20T13:00:00-05:00") =>
    db.query<{ reservation_id: number; manage_token: string }>(
      `select * from reservations_create('${JSON.stringify({
        branch_id: 1,
        starts_at: startsAt,
        party_size: party,
        customer_name: "Rosa",
        customer_phone: "987654321",
      })}'::jsonb)`,
    );

  it("acepta reservas hasta llenar el aforo de la franja y rechaza la que lo supera", async () => {
    await db.exec("update branches set seats_per_slot = 10 where id = 1");
    await reserve(6);
    await reserve(4);
    await expect(reserve(1)).rejects.toThrow(/Sin cupo/);
    const other = await reserve(2, "2026-11-20T13:30:00-05:00");
    expect(other.rows[0]?.manage_token).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("muestra el cupo usado por franja sin datos personales", async () => {
    const { rows } = await db.query<{ seats: number }>(
      "select seats from reservations_reserved_seats(1, '2026-11-20T00:00:00-05:00', '2026-11-21T00:00:00-05:00') order by starts_at",
    );
    expect(rows.map((r) => r.seats)).toEqual([10, 2]);
  });

  it("rechaza fechas bloqueadas", async () => {
    await db.exec(
      "insert into blocked_dates (branch_id, day, reason) values (1, '2026-11-21', 'Evento')",
    );
    await expect(reserve(2, "2026-11-21T13:00:00-05:00")).rejects.toThrow(/no disponible/);
  });

  it("anon no puede crear reservas ni ver el cupo directamente", async () => {
    await expect(
      as("anon", null, "select * from reservations_create('{}'::jsonb)"),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("reglas de datos", () => {
  it("el recojo no admite dirección", async () => {
    await expect(
      db.exec(`insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method, address)
               values (1, 'pickup', 'Ana', '987654321', 100, 100, 'cash', 'Calle 1')`),
    ).rejects.toThrow(/orders_address_by_modality/);
  });

  it("el delivery exige dirección y distrito", async () => {
    await expect(
      db.exec(`insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method)
               values (1, 'delivery', 'Ana', '987654321', 100, 100, 'cash')`),
    ).rejects.toThrow(/orders_address_by_modality/);
  });

  it("el total debe ser subtotal + delivery", async () => {
    await expect(
      db.exec(`insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, delivery_cents, total_cents, payment_method)
               values (1, 'pickup', 'Ana', '987654321', 100, 0, 999, 'cash')`),
    ).rejects.toThrow(/orders_total_matches/);
  });

  it("valida el celular peruano", async () => {
    await expect(
      db.exec(`insert into orders (branch_id, modality, customer_name, customer_phone, subtotal_cents, total_cents, payment_method)
               values (1, 'pickup', 'Ana', '12345', 100, 100, 'cash')`),
    ).rejects.toThrow(/orders_customer_phone_check/);
  });

  it("rechaza productos “(Copiar)”", async () => {
    await expect(
      db.exec(
        `insert into products (id, slug, name, price_cents, category_id) values (9, 'x', 'Ceviche (Copiar)', 1, 73)`,
      ),
    ).rejects.toThrow(/products_no_copy/);
  });

  it("el webhook duplicado no crea dos eventos de pago", async () => {
    const insert = `insert into payment_events (order_id, provider, provider_event_id, type, amount_cents, payload)
                    values (1, 'mock', 'evt_1', 'charge.succeeded', 4500, '{}')`;
    await db.exec(insert);
    await expect(db.exec(insert)).rejects.toThrow(/duplicate key/);
  });

  it("genera tokens de seguimiento únicos y aleatorios", async () => {
    const { rows } = await db.query<{ tracking_token: string }>(
      "select tracking_token from orders",
    );
    expect(new Set(rows.map((r) => r.tracking_token)).size).toBe(rows.length);
    expect(rows[0]?.tracking_token).toMatch(/^[0-9a-f-]{36}$/);
  });
});
