import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { CATALOG_TAG } from "@/features/catalog/data/cached";
import { fail, ok } from "@/lib/api/response";

function sameSecret(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/revalidate · Lo llama el webhook de base de datos de Supabase al editar
 * products, variants, product_menus, categories o menus. Refresca la carta al instante.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return fail(503, "not_configured", "Revalidación no configurada.");
  }
  const received = request.headers.get("x-revalidate-secret") ?? "";
  if (!sameSecret(received, expected)) {
    return fail(401, "unauthorized", "No autorizado.");
  }
  revalidateTag(CATALOG_TAG);
  return ok({ revalidated: CATALOG_TAG });
}
