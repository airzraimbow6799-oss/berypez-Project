-- Promociones: porcentaje, precio fijo o 2×1 sobre un plato de la carta.
-- La web muestra solo las activas y dentro de sus fechas; el precio final lo calcula el servidor.

create type public.promotion_kind as enum ('percent', 'fixed_price', 'two_for_one');

create table public.promotions (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references public.products (id),
  -- Precio fijo en un plato con opciones: a qué opción se aplica (null = al plato).
  variant_id   bigint references public.variants (id),
  kind         public.promotion_kind not null,
  percent_off  smallint check (percent_off between 5 and 90),
  price_cents  integer check (price_cents > 0),
  title        text not null check (length(btrim(title)) between 2 and 60),
  -- Imagen de la ventana emergente (opcional: si falta, se usa la foto del plato).
  image_path   text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  is_active    boolean not null default true,
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint promotions_kind_values check (
    (kind = 'percent' and percent_off is not null and price_cents is null)
    or (kind = 'fixed_price' and price_cents is not null and percent_off is null)
    or (kind = 'two_for_one' and percent_off is null and price_cents is null)
  ),
  constraint promotions_dates check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create index promotions_product_id_idx on public.promotions (product_id);
create index promotions_variant_id_idx on public.promotions (variant_id);
create index promotions_active_idx on public.promotions (is_active) where is_active;

create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

-- La web se refresca al crear, cambiar o pausar una promoción (igual que la carta).
create trigger promotions_revalidate after insert or update or delete on public.promotions
  for each statement execute function private.notify_catalog_change();

alter table public.promotions enable row level security;

-- Público: solo lo vigente y de platos publicados.
create policy "promotions: lectura pública de vigentes" on public.promotions
  for select to anon, authenticated using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );

-- Administración: ve todas (también pausadas, programadas y vencidas) y las gestiona.
create policy "promotions: administración lee todas" on public.promotions
  for select to authenticated using ((select private.current_staff_role()) = 'admin');
create policy "promotions: administración crea" on public.promotions
  for insert to authenticated with check ((select private.current_staff_role()) = 'admin');
create policy "promotions: administración edita" on public.promotions
  for update to authenticated
  using ((select private.current_staff_role()) = 'admin')
  with check ((select private.current_staff_role()) = 'admin');
create policy "promotions: administración elimina" on public.promotions
  for delete to authenticated using ((select private.current_staff_role()) = 'admin');
