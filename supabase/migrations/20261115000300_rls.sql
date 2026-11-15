-- F0-06 · Seguridad: RLS activado en TODAS las tablas.
--
-- Reglas:
-- - anon/authenticated: solo leen la carta, las sedes y las zonas.
-- - Pedidos, pagos, reservas y reclamos: los escribe solo el servidor (/api/*)
--   con service_role, que salta RLS. Nunca se exponen a anon.
-- - Personal (staff_roles): ve y actualiza pedidos y reservas de su sede.

-- Rol del usuario actual. security definer para leer staff_roles sin recursión de RLS.
create function public.current_staff_role() returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff_roles where user_id = (select auth.uid());
$$;

create function public.current_staff_branch() returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select branch_id from public.staff_roles where user_id = (select auth.uid());
$$;

-- El personal puede actuar sobre una sede si es admin global o pertenece a esa sede.
create function public.staff_can_access_branch(target_branch bigint) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_roles s
    where s.user_id = (select auth.uid())
      and (s.branch_id is null or s.branch_id = target_branch)
  );
$$;

revoke execute on function public.current_staff_role() from public, anon;
revoke execute on function public.current_staff_branch() from public, anon;
revoke execute on function public.staff_can_access_branch(bigint) from public, anon;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.current_staff_branch() to authenticated;
grant execute on function public.staff_can_access_branch(bigint) to authenticated;

alter table public.menus enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_menus enable row level security;
alter table public.variants enable row level security;
alter table public.branches enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.reservations enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.complaints enable row level security;
alter table public.staff_roles enable row level security;
alter table public.email_log enable row level security;

-- Lectura pública del catálogo publicado.
create policy "menus: lectura pública" on public.menus
  for select to anon, authenticated using (true);

create policy "categories: lectura pública" on public.categories
  for select to anon, authenticated using (true);

create policy "products: lectura pública de publicados" on public.products
  for select to anon, authenticated using (is_published);

create policy "product_menus: lectura pública" on public.product_menus
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );

create policy "variants: lectura pública" on public.variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );

create policy "branches: lectura pública de activas" on public.branches
  for select to anon, authenticated using (is_active);

create policy "delivery_zones: lectura pública de activas" on public.delivery_zones
  for select to anon, authenticated using (is_active);

create policy "blocked_dates: lectura pública" on public.blocked_dates
  for select to anon, authenticated using (true);

-- Personal: pedidos de su sede.
create policy "orders: personal lee su sede" on public.orders
  for select to authenticated using ((select public.staff_can_access_branch(branch_id)));

create policy "orders: personal cambia estado en su sede" on public.orders
  for update to authenticated
  using ((select public.staff_can_access_branch(branch_id)))
  with check ((select public.staff_can_access_branch(branch_id)));

create policy "order_items: personal lee su sede" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (select public.staff_can_access_branch(o.branch_id))
    )
  );

-- Personal: reservas de su sede.
create policy "reservations: personal lee su sede" on public.reservations
  for select to authenticated using ((select public.staff_can_access_branch(branch_id)));

create policy "reservations: personal cambia estado en su sede" on public.reservations
  for update to authenticated
  using ((select public.staff_can_access_branch(branch_id)))
  with check ((select public.staff_can_access_branch(branch_id)));

-- Reclamos: solo admin.
create policy "complaints: admin lee" on public.complaints
  for select to authenticated using ((select public.current_staff_role()) = 'admin');

-- Cada persona del personal ve su propio rol.
create policy "staff_roles: ver el propio" on public.staff_roles
  for select to authenticated using (user_id = (select auth.uid()));

-- payment_events y email_log: sin políticas → solo service_role (servidor).

-- El personal solo puede cambiar el estado, no montos ni datos del cliente.
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
revoke update on public.reservations from authenticated;
grant update (status) on public.reservations to authenticated;
