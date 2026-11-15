-- F2-02 · Datos iniciales de sedes y zonas (migración de datos, idempotente).
-- REALES (auditoría de berypez.pe, 26/10/2026): los 7 distritos de reparto y la tarifa fija de S/ 7.50.
-- PROVISIONALES hasta que la dueña confirme (README §9): direcciones, teléfonos, horario
-- (11:00–17:00 todos los días) y tiempo estimado (45 min). Se editan en el Table Editor.

insert into public.branches (slug, name, address, district, phone, whatsapp, opening_hours)
values
  ('lince', 'Lince', 'Por confirmar', 'Lince', 'Por confirmar', 'Por confirmar',
   '[{"day":0,"open":"11:00","close":"17:00"},{"day":1,"open":"11:00","close":"17:00"},{"day":2,"open":"11:00","close":"17:00"},{"day":3,"open":"11:00","close":"17:00"},{"day":4,"open":"11:00","close":"17:00"},{"day":5,"open":"11:00","close":"17:00"},{"day":6,"open":"11:00","close":"17:00"}]'::jsonb),
  ('jesus-maria', 'Jesús María', 'Por confirmar', 'Jesús María', 'Por confirmar', 'Por confirmar',
   '[{"day":0,"open":"11:00","close":"17:00"},{"day":1,"open":"11:00","close":"17:00"},{"day":2,"open":"11:00","close":"17:00"},{"day":3,"open":"11:00","close":"17:00"},{"day":4,"open":"11:00","close":"17:00"},{"day":5,"open":"11:00","close":"17:00"},{"day":6,"open":"11:00","close":"17:00"}]'::jsonb)
on conflict (slug) do nothing;

insert into public.delivery_zones (branch_id, district, fee_cents, min_order_cents, eta_minutes)
select b.id, z.district, 750, 0, 45
from (values
  ('lince', 'Lince'),
  ('lince', 'San Isidro'),
  ('lince', 'Miraflores'),
  ('lince', 'San Borja'),
  ('jesus-maria', 'Jesús María'),
  ('jesus-maria', 'Breña'),
  ('jesus-maria', 'Pueblo Libre')
) as z (branch_slug, district)
join public.branches b on b.slug = z.branch_slug
on conflict (district) do nothing;
