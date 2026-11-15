-- F3-04 / F3-14 · Flujo de estados del pedido y tiempo real para el panel.

-- Segunda barrera (además de la API): solo se avanza al siguiente paso válido.
-- delivery: pending/received → in_kitchen → on_the_way → delivered
-- pickup:   pending/received → in_kitchen → ready_for_pickup → delivered
-- Cancelar solo antes de que salga de cocina. service_role (servidor) puede corregir.
create function private.check_order_status_transition() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  from_status text := case when old.status = 'pending' then 'received' else old.status::text end;
  to_status text := new.status::text;
  allowed boolean;
begin
  if new.status = old.status or current_user = 'service_role' or current_user = 'postgres' then
    return new;
  end if;

  allowed := case
    when to_status = 'cancelled' then from_status in ('received', 'in_kitchen')
    when old.modality = 'delivery' then (from_status, to_status) in (
      ('received', 'in_kitchen'), ('in_kitchen', 'on_the_way'), ('on_the_way', 'delivered'))
    else (from_status, to_status) in (
      ('received', 'in_kitchen'), ('in_kitchen', 'ready_for_pickup'), ('ready_for_pickup', 'delivered'))
  end;

  if not allowed then
    raise exception 'Cambio de estado no permitido: % → %', old.status, new.status
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger orders_status_transition
before update of status on public.orders
for each row execute function private.check_order_status_transition();

-- Realtime: el panel recibe pedidos nuevos y cambios (RLS limita a la sede del personal).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
