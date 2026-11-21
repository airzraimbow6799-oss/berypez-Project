import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Modality, OrderStatus } from "./status";

export type PanelOrder = {
  id: number;
  status: OrderStatus;
  modality: Modality;
  customerName: string;
  customerPhone: string;
  district: string | null;
  address: string | null;
  scheduledFor: string | null;
  notes: string | null;
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
  branchName: string;
  items: Array<{
    name: string;
    variantLabel: string | null;
    quantity: number;
    notes: string | null;
    choices: string[];
  }>;
};

/** Pedidos activos y de las últimas 24 h. RLS limita a la sede del personal. */
export async function getPanelOrders(): Promise<PanelOrder[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, modality, customer_name, customer_phone, district, address, scheduled_for, notes, total_cents, payment_method, created_at, branches(name), order_items(product_name, variant_label, quantity, notes, choices)",
    )
    .or(
      `created_at.gte.${since},status.in.(pending,received,in_kitchen,on_the_way,ready_for_pickup)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  return (data ?? []).map((o) => {
    const branch = o.branches as unknown as { name: string } | Array<{ name: string }> | null;
    return {
      id: o.id,
      status: o.status,
      modality: o.modality,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      district: o.district,
      address: o.address,
      scheduledFor: o.scheduled_for,
      notes: o.notes,
      totalCents: o.total_cents,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      branchName: (Array.isArray(branch) ? branch[0]?.name : branch?.name) ?? "",
      items: o.order_items.map((i) => ({
        name: i.product_name,
        variantLabel: i.variant_label,
        quantity: i.quantity,
        notes: i.notes,
        choices: Object.values((i.choices ?? {}) as Record<string, string>),
      })),
    };
  });
}
