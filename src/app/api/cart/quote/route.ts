import type { NextRequest } from "next/server";
import { z } from "zod";

import { quoteCart } from "@/features/checkout/quote";
import { BRANCH_SLUGS, cartItemSchema } from "@/features/checkout/schema";
import { getBranchesAndZones, getProductsByIds, hitRateLimit } from "@/features/checkout/server";
import { clientIp, readJson } from "@/lib/api/request";
import { fail, ok } from "@/lib/api/response";

const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).max(30),
  modality: z.enum(["delivery", "pickup"]).default("pickup"),
  branchSlug: z.enum(BRANCH_SLUGS).default("lince"),
  district: z.string().max(60).default(""),
});

/**
 * POST /api/cart/quote · Recalcula el carrito con los precios de la base (F2-01).
 * El navegador lo llama para mostrar el total real y avisar si algo cambió.
 */
export async function POST(request: NextRequest) {
  const parsed = quoteRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail(400, "invalid_input", "El carrito no es válido.");
  }
  try {
    if (!(await hitRateLimit(`quote:ip:${clientIp(request) ?? "desconocida"}`, 120, 600))) {
      return fail(429, "too_many_requests", "Demasiadas consultas seguidas. Espera un momento.");
    }
    const { items, modality, district } = parsed.data;
    const [{ zones }, products] = await Promise.all([
      getBranchesAndZones(),
      getProductsByIds(items.map((i) => i.productId)),
    ]);
    const zone =
      modality === "delivery" ? (zones.find((z) => z.district === district) ?? null) : null;
    return ok({ ...quoteCart(items, products, zone), etaMinutes: zone?.etaMinutes ?? null });
  } catch {
    return fail(500, "quote_failed", "No pudimos calcular el total. Inténtalo en un momento.");
  }
}
