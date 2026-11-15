import type { NextRequest } from "next/server";
import { z } from "zod";

import { cancelReservation } from "@/features/reservations/server";
import { readJson } from "@/lib/api/request";
import { fail, ok } from "@/lib/api/response";

const bodySchema = z.object({ action: z.literal("cancel") });

/** PATCH /api/reservations/:manageToken · Cancelar con el enlace secreto (F4-01). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const token = z.uuid().safeParse((await params).token);
  const body = bodySchema.safeParse(await readJson(request));
  if (!token.success || !body.success) {
    return fail(400, "invalid_input", "Solicitud inválida.");
  }
  try {
    const result = await cancelReservation(token.data);
    if (result === "not_found")
      return fail(404, "reservation_not_found", "No encontramos esa reserva.");
    if (result === "not_cancellable") {
      return fail(
        409,
        "not_cancellable",
        "Esta reserva ya no se puede cancelar en línea. Escríbenos por WhatsApp.",
      );
    }
    return ok({ status: "cancelled" });
  } catch {
    return fail(500, "cancel_failed", "No pudimos cancelar la reserva. Inténtalo en un momento.");
  }
}
