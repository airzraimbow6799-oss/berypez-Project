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
  insert into branches (slug, name, address, district, phone, whatsapp)
    values ('lince', 'Lince', 'Av. 1', 'Lince', '999999999', '51999999999'),
           ('jesus-maria', 'Jesús María', 'Av. 2', 'Jesús María', '988888888', '51988888888');
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
