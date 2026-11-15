import type { NextRequest } from "next/server";
import { z } from "zod";

import { getOrderByToken } from "@/features/checkout/server";
import { fail, ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:trackingToken · Estado del pedido para quien tiene el enlace (F2-12, F3-04).
 * El token es un UUID aleatorio: no se puede adivinar ni recorrer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const parsed = z.uuid().safeParse((await params).token);
  if (!parsed.success) {
    return fail(404, "order_not_found", "No encontramos ese pedido.");
  }
  try {
    const order = await getOrderByToken(parsed.data);
    return order ? ok(order) : fail(404, "order_not_found", "No encontramos ese pedido.");
  } catch {
    return fail(500, "order_unavailable", "No pudimos cargar tu pedido.");
  }
}
