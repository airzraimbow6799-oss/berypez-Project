import type { NextRequest } from "next/server";
import { z } from "zod";

import { getProductCached } from "@/features/catalog/data/cached";
import { fail, ok } from "@/lib/api/response";

const paramsSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,120}$/),
});

/** GET /api/products/:slug · Plato con variantes y grupos de elección. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return fail(400, "invalid_slug", "El identificador del plato no es válido.");
  }
  try {
    const product = await getProductCached(parsed.data.slug);
    return product ? ok(product) : fail(404, "product_not_found", "No encontramos ese plato.");
  } catch {
    return fail(500, "catalog_unavailable", "No pudimos cargar el plato. Inténtalo en un momento.");
  }
}
