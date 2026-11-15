import "server-only";

import { readPublicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";

import { createCatalogRepository } from "../catalog/data/repository";
import { type OpeningHours, parseOpeningHours } from "./hours";

export type Zone = {
  district: string;
  branchId: number;
  feeCents: number;
  minOrderCents: number;
  etaMinutes: number;
};

export type Branch = {
  id: number;
  slug: string;
  name: string;
  /** Solo si es un número real (los provisionales “Por confirmar” quedan en null). */
  whatsapp: string | null;
  openingHours: OpeningHours;
};

const onlyRealPhone = (value: string) => (/^\d{9,15}$/.test(value) ? value : null);

/** Sedes activas y zonas de reparto (lectura pública con RLS). */
export async function getBranchesAndZones(): Promise<{ branches: Branch[]; zones: Zone[] }> {
  const client = createPublicClient();
  const [branches, zones] = await Promise.all([
    client.from("branches").select("id, slug, name, whatsapp, opening_hours").order("id"),
    client
      .from("delivery_zones")
      .select("district, branch_id, fee_cents, min_order_cents, eta_minutes")
      .order("district"),
  ]);
  if (branches.error || zones.error) {
    throw new Error(branches.error?.message ?? zones.error?.message);
  }
  return {
    branches: branches.data.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      whatsapp: onlyRealPhone(b.whatsapp),
      openingHours: parseOpeningHours(b.opening_hours),
    })),
    zones: zones.data.map((z) => ({
      district: z.district,
      branchId: z.branch_id,
      feeCents: z.fee_cents,
      minOrderCents: z.min_order_cents,
      etaMinutes: z.eta_minutes,
    })),
  };
}

export function getProductsByIds(ids: readonly number[]) {
  return createCatalogRepository(
    createPublicClient(),
    readPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
  ).getProductsByIds(ids);
}

/** F2-15 · Registra un intento; false si se superó el límite de la ventana. */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await createServiceClient().rpc("checkout_hit_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    // Si el contador falla, no se bloquea a clientes reales: Turnstile sigue protegiendo.
    return error ? true : data === true;
  } catch {
    return true;
  }
}

export type NewOrder = {
  order: Record<string, string | number | null>;
  items: Array<Record<string, string | number | null | Record<string, string>>>;
};

export async function createOrder({ order, items }: NewOrder) {
  const { data, error } = await createServiceClient().rpc("checkout_create_order", {
    p_order: order,
    p_items: items,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    throw new Error(error?.message ?? "No se creó el pedido");
  }
  return { orderId: row.order_id, trackingToken: row.tracking_token };
}

export async function getOrderByToken(token: string) {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select(
      "id, status, modality, payment_method, payment_status, subtotal_cents, delivery_cents, total_cents, scheduled_for, created_at, district, branches(name), order_items(product_name, variant_label, choices, quantity, line_total_cents, notes)",
    )
    .eq("tracking_token", token)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
