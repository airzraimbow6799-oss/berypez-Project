import type { NextRequest } from "next/server";
import { z } from "zod";

import { getMenuCached } from "@/features/catalog/data/cached";
import { fail, ok } from "@/lib/api/response";
import { MENU_SLUGS } from "@/types/catalog";

const paramsSchema = z.object({ slug: z.enum(MENU_SLUGS) });

/** GET /api/menus/:slug · Carta con sus secciones y productos. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return fail(404, "menu_not_found", "Esa carta no existe.");
  }
  try {
    const page = await getMenuCached(parsed.data.slug);
    return page ? ok(page) : fail(404, "menu_not_found", "Esa carta no existe.");
  } catch {
    return fail(500, "catalog_unavailable", "No pudimos cargar la carta. Inténtalo en un momento.");
  }
}
