import type { NextRequest } from "next/server";
import { z } from "zod";

import { canTransition, ORDER_STATUSES } from "@/features/orders/status";
import { readJson } from "@/lib/api/request";
import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ status: z.enum(ORDER_STATUSES) });

/**
 * PATCH /api/admin/orders/:id/status · Cambio de estado por el personal (F3-04).
 * Usa la sesión del personal: RLS limita a su sede y el trigger de la base vuelve a
 * validar la transición.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await params).id);
  const body = bodySchema.safeParse(await readJson(request));
  if (!id.success || !body.success) {
    return fail(400, "invalid_input", "Datos inválidos.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return fail(401, "unauthorized", "Inicia sesión para continuar.");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, modality")
    .eq("id", id.data)
    .maybeSingle();
  if (error) return fail(500, "order_unavailable", "No pudimos leer el pedido.");
  if (!order) return fail(404, "order_not_found", "No encontramos ese pedido.");

  if (!canTransition(order.status, body.data.status, order.modality)) {
    return fail(409, "invalid_transition", "Ese cambio de estado no está permitido.");
  }

  const update = await supabase
    .from("orders")
    .update({ status: body.data.status })
    .eq("id", order.id);
  if (update.error) {
    return fail(409, "invalid_transition", "No se pudo cambiar el estado.");
  }
  return ok({ id: order.id, status: body.data.status });
}
