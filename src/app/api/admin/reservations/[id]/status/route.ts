import type { NextRequest } from "next/server";
import { z } from "zod";

import { readJson } from "@/lib/api/request";
import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ status: z.enum(["arrived", "no_show", "cancelled"]) });

/** PATCH /api/admin/reservations/:id/status · Llegó / no vino / cancelada (F4-06). RLS limita a la sede. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await params).id);
  const body = bodySchema.safeParse(await readJson(request));
  if (!id.success || !body.success) return fail(400, "invalid_input", "Datos inválidos.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail(401, "unauthorized", "Inicia sesión para continuar.");

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: body.data.status })
    .eq("id", id.data)
    .eq("status", "confirmed")
    .select("id");
  if (error) return fail(500, "update_failed", "No se pudo actualizar la reserva.");
  if (!data || data.length === 0)
    return fail(404, "reservation_not_found", "No encontramos esa reserva o ya fue atendida.");
  return ok({ id: id.data, status: body.data.status });
}
