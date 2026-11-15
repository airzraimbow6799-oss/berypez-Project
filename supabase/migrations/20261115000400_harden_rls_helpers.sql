-- F0-06 · Correcciones de los avisos de seguridad y rendimiento de Supabase.
--
-- 1. Las funciones SECURITY DEFINER de RLS pasan al esquema `private`, que la API
--    (PostgREST) no expone: ya no se pueden llamar por /rest/v1/rpc/*.
-- 2. Índices para las claves foráneas sin cobertura.
-- 3. rls_auto_enable() (event trigger de Supabase) deja de ser ejecutable por anon/authenticated.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.current_staff_role() returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff_roles where user_id = (select auth.uid());
$$;

create function private.staff_can_access_branch(target_branch bigint) returns boolean
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

revoke execute on function private.current_staff_role() from public;
revoke execute on function private.staff_can_access_branch(bigint) from public;
grant execute on function private.current_staff_role() to authenticated;
grant execute on function private.staff_can_access_branch(bigint) to authenticated;

-- Políticas que usaban las funciones de public → ahora usan las de private.
drop policy "orders: personal lee su sede" on public.orders;
drop policy "orders: personal cambia estado en su sede" on public.orders;
drop policy "order_items: personal lee su sede" on public.order_items;
drop policy "reservations: personal lee su sede" on public.reservations;
drop policy "reservations: personal cambia estado en su sede" on public.reservations;
drop policy "complaints: admin lee" on public.complaints;

create policy "orders: personal lee su sede" on public.orders
  for select to authenticated using ((select private.staff_can_access_branch(branch_id)));

create policy "orders: personal cambia estado en su sede" on public.orders
  for update to authenticated
  using ((select private.staff_can_access_branch(branch_id)))
  with check ((select private.staff_can_access_branch(branch_id)));

create policy "order_items: personal lee su sede" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (select private.staff_can_access_branch(o.branch_id))
    )
  );

create policy "reservations: personal lee su sede" on public.reservations
  for select to authenticated using ((select private.staff_can_access_branch(branch_id)));

create policy "reservations: personal cambia estado en su sede" on public.reservations
  for update to authenticated
  using ((select private.staff_can_access_branch(branch_id)))
  with check ((select private.staff_can_access_branch(branch_id)));

create policy "complaints: admin lee" on public.complaints
  for select to authenticated using ((select private.current_staff_role()) = 'admin');

drop function public.current_staff_role();
drop function public.current_staff_branch();
drop function public.staff_can_access_branch(bigint);

create index complaints_branch_id_idx on public.complaints (branch_id);
create index order_items_variant_id_idx on public.order_items (variant_id);
create index staff_roles_branch_id_idx on public.staff_roles (branch_id);

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
