-- B-R2 · Carta administrable desde el panel.
-- Solo agrega: secuencias para los platos nuevos, una marca de «opción archivada» y funciones
-- para que Administración guarde la carta. No borra datos: «eliminar» un plato lo oculta
-- (is_published = false) y una opción con pedidos se archiva en vez de borrarse.

-- 1. Rol de Recepción (el panel ya lo usa; `cocina` queda en el enum sin uso).
alter type public.staff_role add value if not exists 'salon';

-- 2. Ids para lo que se cree desde el panel. Los de WooCommerce llegan a ~2 000; se empieza
--    lejos para que una importación futura nunca choque.
create sequence public.products_id_seq start with 100000 owned by public.products.id;
create sequence public.variants_id_seq start with 100000 owned by public.variants.id;
create sequence public.categories_id_seq start with 1000 owned by public.categories.id;
alter table public.products alter column id set default nextval('public.products_id_seq');
alter table public.variants alter column id set default nextval('public.variants_id_seq');
alter table public.categories alter column id set default nextval('public.categories_id_seq');

-- 3. Opción quitada de un plato que ya tiene pedidos: queda archivada (la web no la muestra).
alter table public.variants add column is_archived boolean not null default false;

-- 4. Funciones de Administración. Viven en `private` (SECURITY DEFINER, no expuestas) y la API
--    llama a envoltorios de `public` que se ejecutan con los permisos de quien llama.
create function private.require_catalog_admin() returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if private.current_staff_role() is distinct from 'admin' then
    raise exception 'Solo Administración puede cambiar la carta' using errcode = '42501';
  end if;
end;
$$;

/*
  Guarda un plato (crea si no trae id). Formato de p:
  { id?, name, slug, description, price_cents, section, section_slug, image_path, image_alt,
    tags: [], menus: [], is_available, variant_label, choice_groups: [{key,label,options}],
    variants: [{ id?, label, price_cents }] }
*/
create function private.admin_save_product(p jsonb) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint := nullif(p ->> 'id', '')::bigint;
  v_section text := btrim(p ->> 'section');
  v_category bigint;
  v_slug text;
  v_menus public.menu_slug[];
  v_keep bigint[] := '{}';
  v_variant jsonb;
  v_variant_id bigint;
  v_position integer;
begin
  perform private.require_catalog_admin();

  -- Sección → categoría (se crea si es nueva).
  select id into v_category from public.categories where lower(name) = lower(v_section);
  if v_category is null then
    insert into public.categories (slug, name, sort_order)
    values (
      case
        when exists (select 1 from public.categories where slug = p ->> 'section_slug')
          then (p ->> 'section_slug') || '-' || nextval('public.categories_id_seq')
        else p ->> 'section_slug'
      end,
      v_section,
      coalesce((select max(sort_order) from public.categories), 0) + 1
    )
    returning id into v_category;
  end if;

  select coalesce(array_agg(m::public.menu_slug), '{}')
    into v_menus from jsonb_array_elements_text(p -> 'menus') as m;
  if cardinality(v_menus) = 0 then
    raise exception 'El plato necesita al menos una carta' using errcode = '22023';
  end if;

  if v_id is null then
    v_id := nextval('public.products_id_seq');
    v_slug := p ->> 'slug';
    if exists (select 1 from public.products where slug = v_slug) then
      v_slug := v_slug || '-' || v_id;
    end if;
    insert into public.products (
      id, slug, name, description, price_cents, variant_label, category_id,
      image_path, image_alt, tags, choice_groups, is_available, is_published
    ) values (
      v_id, v_slug, p ->> 'name', coalesce(p ->> 'description', ''),
      (p ->> 'price_cents')::integer, nullif(p ->> 'variant_label', ''), v_category,
      nullif(p ->> 'image_path', ''), nullif(p ->> 'image_alt', ''),
      array(select jsonb_array_elements_text(p -> 'tags')),
      coalesce(p -> 'choice_groups', '[]'::jsonb),
      coalesce((p ->> 'is_available')::boolean, true), true
    );
  else
    update public.products set
      name = p ->> 'name',
      description = coalesce(p ->> 'description', ''),
      price_cents = (p ->> 'price_cents')::integer,
      variant_label = nullif(p ->> 'variant_label', ''),
      category_id = v_category,
      image_path = nullif(p ->> 'image_path', ''),
      image_alt = nullif(p ->> 'image_alt', ''),
      tags = array(select jsonb_array_elements_text(p -> 'tags')),
      choice_groups = coalesce(p -> 'choice_groups', '[]'::jsonb),
      is_available = coalesce((p ->> 'is_available')::boolean, is_available),
      is_published = true
    where id = v_id;
    if not found then
      raise exception 'No existe el plato %', v_id using errcode = 'P0002';
    end if;
  end if;

  -- Cartas donde aparece.
  delete from public.product_menus where product_id = v_id and menu_slug <> all (v_menus);
  insert into public.product_menus (product_id, menu_slug)
    select v_id, unnest(v_menus) on conflict do nothing;

  -- Opciones con precio: se actualizan las que ya existen y se crean las nuevas.
  for v_variant, v_position in
    select value, ordinality::integer from jsonb_array_elements(coalesce(p -> 'variants', '[]'::jsonb)) with ordinality
  loop
    v_variant_id := nullif(v_variant ->> 'id', '')::bigint;
    if v_variant_id is not null
       and exists (select 1 from public.variants where id = v_variant_id and product_id = v_id) then
      update public.variants set
        label = v_variant ->> 'label',
        price_cents = (v_variant ->> 'price_cents')::integer,
        sort_order = v_position,
        is_archived = false
      where id = v_variant_id;
    else
      insert into public.variants (product_id, label, price_cents, sort_order)
      values (v_id, v_variant ->> 'label', (v_variant ->> 'price_cents')::integer, v_position)
      returning id into v_variant_id;
    end if;
    v_keep := v_keep || v_variant_id;
  end loop;

  -- Opciones quitadas: se borran si nunca se pidieron; si no, se archivan.
  delete from public.variants v
    where v.product_id = v_id and v.id <> all (v_keep)
      and not exists (select 1 from public.order_items oi where oi.variant_id = v.id);
  update public.variants set is_archived = true
    where product_id = v_id and id <> all (v_keep);

  return v_id;
end;
$$;

create function private.admin_set_product_available(p_id bigint, p_available boolean) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_catalog_admin();
  update public.products set is_available = p_available where id = p_id;
end;
$$;

create function private.admin_set_product_price(p_id bigint, p_price_cents integer) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_catalog_admin();
  update public.products set price_cents = p_price_cents where id = p_id;
end;
$$;

-- «Eliminar» desde el panel: el plato sale de la carta pero sigue en la base (los pedidos lo usan).
create function private.admin_unpublish_product(p_id bigint) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_catalog_admin();
  update public.products set is_published = false where id = p_id;
end;
$$;

revoke execute on function private.require_catalog_admin() from public;
revoke execute on function private.admin_save_product(jsonb) from public;
revoke execute on function private.admin_set_product_available(bigint, boolean) from public;
revoke execute on function private.admin_set_product_price(bigint, integer) from public;
revoke execute on function private.admin_unpublish_product(bigint) from public;
grant execute on function private.require_catalog_admin() to authenticated;
grant execute on function private.admin_save_product(jsonb) to authenticated;
grant execute on function private.admin_set_product_available(bigint, boolean) to authenticated;
grant execute on function private.admin_set_product_price(bigint, integer) to authenticated;
grant execute on function private.admin_unpublish_product(bigint) to authenticated;

create function public.admin_save_product(p jsonb) returns bigint
language sql
set search_path = ''
as $$ select private.admin_save_product(p) $$;

create function public.admin_set_product_available(p_id bigint, p_available boolean) returns void
language sql
set search_path = ''
as $$ select private.admin_set_product_available(p_id, p_available) $$;

create function public.admin_set_product_price(p_id bigint, p_price_cents integer) returns void
language sql
set search_path = ''
as $$ select private.admin_set_product_price(p_id, p_price_cents) $$;

create function public.admin_unpublish_product(p_id bigint) returns void
language sql
set search_path = ''
as $$ select private.admin_unpublish_product(p_id) $$;

revoke execute on function public.admin_save_product(jsonb) from public, anon;
revoke execute on function public.admin_set_product_available(bigint, boolean) from public, anon;
revoke execute on function public.admin_set_product_price(bigint, integer) from public, anon;
revoke execute on function public.admin_unpublish_product(bigint) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;
grant execute on function public.admin_set_product_available(bigint, boolean) to authenticated;
grant execute on function public.admin_set_product_price(bigint, integer) to authenticated;
grant execute on function public.admin_unpublish_product(bigint) to authenticated;
