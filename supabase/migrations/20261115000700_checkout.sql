-- F2 · Checkout: límite de peticiones y creación del pedido en una sola transacción.

-- F2-15 · Contador de peticiones por clave (IP o celular) y ventana de tiempo.
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 1,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
-- Sin políticas: solo el servidor (service_role) la usa.

create index rate_limits_window_idx on public.rate_limits (window_start);

-- Registra un intento y devuelve true si aún está dentro del límite.
create function private.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  current_hits integer;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, bucket, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into current_hits;

  -- Limpieza oportunista de ventanas viejas.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return current_hits <= p_limit;
end;
$$;

-- F2-04 · Crea el pedido y sus líneas de forma atómica. Los montos llegan ya calculados
-- por el servidor desde la base (nunca del navegador) y aquí se vuelven a validar.
create function private.create_order(p_order jsonb, p_items jsonb)
returns table (order_id bigint, tracking_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
  new_token uuid;
  items_total integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene platos' using errcode = '22023';
  end if;

  select coalesce(sum((item->>'line_total_cents')::integer), 0)
    into items_total
    from jsonb_array_elements(p_items) as item;

  if items_total <> (p_order->>'subtotal_cents')::integer then
    raise exception 'El subtotal no coincide con las líneas' using errcode = '22023';
  end if;

  insert into public.orders (
    branch_id, modality, customer_name, customer_phone, customer_email,
    address, address_reference, district, scheduled_for, notes,
    subtotal_cents, delivery_cents, total_cents,
    payment_method, cash_change_for_cents
  ) values (
    (p_order->>'branch_id')::bigint,
    (p_order->>'modality')::public.order_modality,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    nullif(p_order->>'customer_email', ''),
    nullif(p_order->>'address', ''),
    nullif(p_order->>'address_reference', ''),
    nullif(p_order->>'district', ''),
    nullif(p_order->>'scheduled_for', '')::timestamptz,
    nullif(p_order->>'notes', ''),
    (p_order->>'subtotal_cents')::integer,
    (p_order->>'delivery_cents')::integer,
    (p_order->>'total_cents')::integer,
    (p_order->>'payment_method')::public.payment_method,
    nullif(p_order->>'cash_change_for_cents', '')::integer
  )
  returning id, orders.tracking_token into new_id, new_token;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, variant_label, choices,
    quantity, unit_price_cents, line_total_cents, notes
  )
  select
    new_id,
    (item->>'product_id')::bigint,
    nullif(item->>'variant_id', '')::bigint,
    item->>'product_name',
    nullif(item->>'variant_label', ''),
    coalesce(item->'choices', '{}'::jsonb),
    (item->>'quantity')::smallint,
    (item->>'unit_price_cents')::integer,
    (item->>'line_total_cents')::integer,
    nullif(item->>'notes', '')
  from jsonb_array_elements(p_items) as item;

  return query select new_id, new_token;
end;
$$;

revoke execute on function private.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function private.create_order(jsonb, jsonb) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function private.create_order(jsonb, jsonb) to service_role;

-- Fachadas en public (la API solo expone public) ejecutables únicamente por service_role.
create function public.checkout_hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$ select private.hit_rate_limit(p_key, p_limit, p_window_seconds) $$;

create function public.checkout_create_order(p_order jsonb, p_items jsonb)
returns table (order_id bigint, tracking_token uuid)
language sql
security invoker
set search_path = ''
as $$ select * from private.create_order(p_order, p_items) $$;

revoke execute on function public.checkout_hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.checkout_create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.checkout_hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.checkout_create_order(jsonb, jsonb) to service_role;
