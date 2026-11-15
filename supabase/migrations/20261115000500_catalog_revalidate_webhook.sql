-- F1-02 · Revalidación de la carta al editar en Supabase.
-- Cada cambio en el catálogo hace un POST a /api/revalidate (Next.js) con un secreto.
-- La URL y el secreto viven en Supabase Vault (nunca en el repositorio):
--   select vault.create_secret('https://…/api/revalidate', 'catalog_revalidate_url');
--   select vault.create_secret('<secreto>', 'catalog_revalidate_secret');
-- Sin pg_net o sin Vault (por ejemplo, en los tests con PGlite) el trigger no hace nada.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
end;
$$;

create function private.notify_catalog_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_url text;
  target_secret text;
begin
  if to_regnamespace('net') is null or to_regnamespace('vault') is null then
    return null;
  end if;

  select decrypted_secret into target_url
    from vault.decrypted_secrets where name = 'catalog_revalidate_url';
  select decrypted_secret into target_secret
    from vault.decrypted_secrets where name = 'catalog_revalidate_secret';

  if target_url is null or target_secret is null then
    return null;
  end if;

  perform net.http_post(
    url := target_url,
    body := jsonb_build_object('table', tg_table_name, 'op', tg_op),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-revalidate-secret', target_secret
    ),
    timeout_milliseconds := 3000
  );
  return null;
end;
$$;

revoke execute on function private.notify_catalog_change() from public, anon, authenticated;

-- Una llamada por sentencia (no por fila): la carga masiva dispara un solo POST.
create trigger products_revalidate after insert or update or delete on public.products
  for each statement execute function private.notify_catalog_change();
create trigger variants_revalidate after insert or update or delete on public.variants
  for each statement execute function private.notify_catalog_change();
create trigger product_menus_revalidate after insert or update or delete on public.product_menus
  for each statement execute function private.notify_catalog_change();
create trigger categories_revalidate after insert or update or delete on public.categories
  for each statement execute function private.notify_catalog_change();
create trigger menus_revalidate after insert or update or delete on public.menus
  for each statement execute function private.notify_catalog_change();
