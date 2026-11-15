-- Aviso del advisor: pg_net quedó registrado en el esquema public.
-- pg_net no es reubicable (no admite SET SCHEMA): se reinstala en `extensions`.
-- Solo se pierde net._http_response, el registro temporal de llamadas HTTP.
-- Las funciones siguen en el esquema `net`, así que el trigger de revalidación no cambia.

do $$
begin
  if exists (
    select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_net' and n.nspname = 'public'
  ) then
    drop extension pg_net;
    create schema if not exists extensions;
    create extension pg_net with schema extensions;
  end if;
end;
$$;
