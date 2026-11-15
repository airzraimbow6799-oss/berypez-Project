-- F0-06 · Operación: sedes, zonas, pedidos, pagos, reservas, reclamos y personal.

create type public.order_modality as enum ('delivery', 'pickup');
create type public.order_status as enum (
  'pending', 'received', 'in_kitchen', 'on_the_way', 'ready_for_pickup', 'delivered', 'cancelled'
);
create type public.payment_method as enum ('yape', 'plin', 'card', 'cash');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.reservation_status as enum ('confirmed', 'arrived', 'no_show', 'cancelled');
create type public.staff_role as enum ('admin', 'cocina');

create table public.branches (
  id             bigint generated always as identity primary key,
  slug           text not null unique,
  name           text not null,
  address        text not null,
  district       text not null,
  phone          text not null,
  whatsapp       text not null,
  maps_url       text,
  -- Horario semanal: [{ "day": 1, "open": "11:00", "close": "17:00" }, …] (day: 0 = domingo).
  opening_hours  jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
  -- Aforo por franja de 30 min para reservas (F4-02).
  seats_per_slot smallint not null default 40 check (seats_per_slot > 0),
  is_active      boolean not null default true
);

create table public.delivery_zones (
  id             bigint generated always as identity primary key,
  branch_id      bigint not null references public.branches (id),
  district       text not null,
  fee_cents      integer not null check (fee_cents >= 0),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  eta_minutes    smallint not null check (eta_minutes > 0),
  is_active      boolean not null default true,
  unique (district)
);

create index delivery_zones_branch_id_idx on public.delivery_zones (branch_id);

create table public.orders (
  id              bigint generated always as identity primary key,
  -- Token aleatorio para el seguimiento público: no se puede adivinar ni enumerar.
  tracking_token  uuid not null unique default gen_random_uuid(),
  branch_id       bigint not null references public.branches (id),
  modality        public.order_modality not null,
  status          public.order_status not null default 'pending',
  customer_name   text not null check (length(customer_name) between 2 and 80),
  customer_phone  text not null check (customer_phone ~ '^9\d{8}$'),
  customer_email  text check (customer_email is null or length(customer_email) <= 254),
  address         text,
  address_reference text,
  district        text,
  scheduled_for   timestamptz,
  notes           text check (notes is null or length(notes) <= 500),
  subtotal_cents  integer not null check (subtotal_cents >= 0),
  delivery_cents  integer not null default 0 check (delivery_cents >= 0),
  total_cents     integer not null,
  payment_method  public.payment_method not null,
  payment_status  public.payment_status not null default 'unpaid',
  cash_change_for_cents integer check (cash_change_for_cents is null or cash_change_for_cents >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint orders_total_matches check (total_cents = subtotal_cents + delivery_cents),
  -- El recojo no lleva dirección; el delivery sí (hallazgo 6 de la auditoría).
  constraint orders_address_by_modality check (
    (modality = 'delivery' and address is not null and district is not null)
    or (modality = 'pickup' and address is null)
  )
);

create index orders_branch_status_idx on public.orders (branch_id, status, created_at desc);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id               bigint generated always as identity primary key,
  order_id         bigint not null references public.orders (id) on delete cascade,
  product_id       bigint not null references public.products (id),
  variant_id       bigint references public.variants (id),
  -- Copia del nombre y precio al momento de la compra (el catálogo puede cambiar).
  product_name     text not null,
  variant_label    text,
  choices          jsonb not null default '{}'::jsonb,
  quantity         smallint not null check (quantity between 1 and 50),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null,
  notes            text check (notes is null or length(notes) <= 200),
  constraint order_items_line_total_matches check (line_total_cents = unit_price_cents * quantity)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create table public.payment_events (
  id                bigint generated always as identity primary key,
  order_id          bigint not null references public.orders (id),
  provider          text not null,
  -- Id del evento en la pasarela: garantiza idempotencia del webhook (F3-03).
  provider_event_id text not null,
  type              text not null,
  amount_cents      integer not null check (amount_cents >= 0),
  payload           jsonb not null,
  received_at       timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index payment_events_order_id_idx on public.payment_events (order_id);

create table public.reservations (
  id             bigint generated always as identity primary key,
  manage_token   uuid not null unique default gen_random_uuid(),
  branch_id      bigint not null references public.branches (id),
  starts_at      timestamptz not null,
  party_size     smallint not null check (party_size between 1 and 20),
  area           text check (area is null or area in ('interior', 'terraza')),
  occasion       text check (occasion is null or length(occasion) <= 60),
  customer_name  text not null check (length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^9\d{8}$'),
  customer_email text check (customer_email is null or length(customer_email) <= 254),
  status         public.reservation_status not null default 'confirmed',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index reservations_branch_starts_idx on public.reservations (branch_id, starts_at);

create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create table public.blocked_dates (
  branch_id bigint not null references public.branches (id),
  day       date not null,
  reason    text,
  primary key (branch_id, day)
);

-- Libro de Reclamaciones (Ley 29571). Número correlativo único.
create sequence public.complaints_number_seq;

create table public.complaints (
  id             bigint generated always as identity primary key,
  number         bigint not null unique default nextval('public.complaints_number_seq'),
  kind           text not null check (kind in ('reclamo', 'queja')),
  branch_id      bigint references public.branches (id),
  customer_name  text not null check (length(customer_name) between 2 and 120),
  document_type  text not null check (document_type in ('DNI', 'CE', 'PASAPORTE', 'RUC')),
  document_number text not null check (length(document_number) between 6 and 15),
  customer_phone text not null,
  customer_email text not null check (length(customer_email) <= 254),
  address        text,
  is_minor       boolean not null default false,
  guardian_name  text,
  item_type      text not null check (item_type in ('producto', 'servicio')),
  amount_cents   integer check (amount_cents is null or amount_cents >= 0),
  description    text not null check (length(description) between 10 and 2000),
  request        text not null check (length(request) between 5 and 1000),
  created_at     timestamptz not null default now()
);

alter sequence public.complaints_number_seq owned by public.complaints.number;

create table public.staff_roles (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  role      public.staff_role not null,
  -- null = todas las sedes (admin).
  branch_id bigint references public.branches (id)
);

create table public.email_log (
  id          bigint generated always as identity primary key,
  order_id    bigint references public.orders (id),
  reservation_id bigint references public.reservations (id),
  complaint_id bigint references public.complaints (id),
  template    text not null,
  to_email    text not null,
  resend_id   text,
  status      text not null default 'queued',
  attempts    smallint not null default 1,
  created_at  timestamptz not null default now()
);

create index email_log_order_id_idx on public.email_log (order_id);
create index email_log_reservation_id_idx on public.email_log (reservation_id);
create index email_log_complaint_id_idx on public.email_log (complaint_id);
