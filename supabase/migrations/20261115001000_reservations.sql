-- F4-01 / F4-02 · Reservas sin sobreventa y Libro de Reclamaciones.

-- Crea una reserva verificando el aforo DENTRO de la transacción, con un bloqueo por
-- sede y franja: dos reservas simultáneas no pueden superar el aforo.
create function private.create_reservation(p jsonb)
returns table (reservation_id bigint, manage_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_branch bigint := (p->>'branch_id')::bigint;
  v_starts timestamptz := (p->>'starts_at')::timestamptz;
  v_party smallint := (p->>'party_size')::smallint;
  v_capacity smallint;
  v_booked integer;
  new_id bigint;
  new_token uuid;
begin
  perform pg_advisory_xact_lock(v_branch::integer, (extract(epoch from v_starts) / 60)::integer);

  if exists (
    select 1 from public.blocked_dates
    where branch_id = v_branch and day = (v_starts at time zone 'America/Lima')::date
  ) then
    raise exception 'Fecha no disponible' using errcode = 'P0001', hint = 'blocked';
  end if;

  select seats_per_slot into v_capacity from public.branches where id = v_branch and is_active;
  if v_capacity is null then
    raise exception 'Sede no disponible' using errcode = 'P0001', hint = 'branch';
  end if;

  select coalesce(sum(party_size), 0) into v_booked
  from public.reservations
  where branch_id = v_branch and starts_at = v_starts and status in ('confirmed', 'arrived');

  if v_booked + v_party > v_capacity then
    raise exception 'Sin cupo en esa franja' using errcode = 'P0001', hint = 'full';
  end if;

  insert into public.reservations (
    branch_id, starts_at, party_size, area, occasion, customer_name, customer_phone, customer_email
  ) values (
    v_branch, v_starts, v_party,
    nullif(p->>'area', ''), nullif(p->>'occasion', ''),
    p->>'customer_name', p->>'customer_phone', nullif(p->>'customer_email', '')
  )
  returning id, reservations.manage_token into new_id, new_token;

  return query select new_id, new_token;
end;
$$;

-- Personas ya reservadas por franja (para mostrar disponibilidad sin exponer datos personales).
create function private.reserved_seats(p_branch bigint, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, seats integer)
language sql
stable
security definer
set search_path = ''
as $$
  select r.starts_at, sum(r.party_size)::integer
  from public.reservations r
  where r.branch_id = p_branch and r.starts_at >= p_from and r.starts_at < p_to
    and r.status in ('confirmed', 'arrived')
  group by r.starts_at;
$$;

create function public.reservations_create(p jsonb)
returns table (reservation_id bigint, manage_token uuid)
language sql security invoker set search_path = ''
as $$ select * from private.create_reservation(p) $$;

create function public.reservations_reserved_seats(p_branch bigint, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, seats integer)
language sql security invoker set search_path = ''
as $$ select * from private.reserved_seats(p_branch, p_from, p_to) $$;

revoke execute on function private.create_reservation(jsonb) from public, anon, authenticated;
revoke execute on function private.reserved_seats(bigint, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.reservations_create(jsonb) from public, anon, authenticated;
revoke execute on function public.reservations_reserved_seats(bigint, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function private.create_reservation(jsonb) to service_role;
grant execute on function private.reserved_seats(bigint, timestamptz, timestamptz) to service_role;
grant execute on function public.reservations_create(jsonb) to service_role;
grant execute on function public.reservations_reserved_seats(bigint, timestamptz, timestamptz) to service_role;

create index reservations_manage_token_idx on public.reservations (manage_token);
