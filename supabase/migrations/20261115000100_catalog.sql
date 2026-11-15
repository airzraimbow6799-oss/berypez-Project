-- F0-06 · Catálogo: cartas, secciones, productos y variantes.
-- Montos en céntimos enteros (integer): exactos, sin coma flotante. S/ 42.50 = 4250.
-- Los ids de productos y variantes conservan los de WooCommerce (estables entre importaciones).

create type public.menu_slug as enum ('marina', 'criolla', 'berycafe', 'piqueos', 'el-bar', 'vegetariana');

create table public.menus (
  slug        public.menu_slug primary key,
  name        text not null,
  description text not null default '',
  sort_order  smallint not null
);

create table public.categories (
  id         bigint primary key,
  slug       text not null unique,
  name       text not null,
  sort_order smallint not null
);

create table public.products (
  id             bigint primary key,
  slug           text not null unique,
  name           text not null check (length(name) between 1 and 120),
  description    text not null default '',
  price_cents    integer not null check (price_cents >= 0),
  variant_label  text,
  category_id    bigint not null references public.categories (id),
  image_path     text,
  image_alt      text,
  tags           text[] not null default '{}',
  allergens      text[] not null default '{}',
  portion        text,
  choice_groups  jsonb not null default '[]'::jsonb check (jsonb_typeof(choice_groups) = 'array'),
  is_available   boolean not null default true,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- RF-10: no se permiten duplicados “(Copiar)”.
  constraint products_no_copy check (name !~* '\(copiar\)'),
  constraint products_tags_valid check (
    tags <@ array['picante', 'vegetariano', 'compartir', 'favorito', 'ninos', 'nuevo']::text[]
  ),
  constraint products_allergens_valid check (
    allergens <@ array['pescado', 'mariscos', 'gluten', 'lacteos', 'frutos-secos', 'huevo']::text[]
  )
);

create index products_category_id_idx on public.products (category_id);
create index products_published_idx on public.products (is_published) where is_published;

create table public.product_menus (
  product_id bigint not null references public.products (id) on delete cascade,
  menu_slug  public.menu_slug not null references public.menus (slug),
  primary key (product_id, menu_slug)
);

create index product_menus_menu_slug_idx on public.product_menus (menu_slug, product_id);

create table public.variants (
  id           bigint primary key,
  product_id   bigint not null references public.products (id) on delete cascade,
  label        text not null,
  price_cents  integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  selections   jsonb not null default '{}'::jsonb check (jsonb_typeof(selections) = 'object'),
  sort_order   smallint not null default 0
);

create index variants_product_id_idx on public.variants (product_id, sort_order);

-- Mantiene updated_at al día (lo usa el webhook de revalidación de F1-02).
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
