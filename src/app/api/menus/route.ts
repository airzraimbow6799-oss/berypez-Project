import { getMenusCached } from "@/features/catalog/data/cached";
import { fail, ok } from "@/lib/api/response";

/** GET /api/menus · Las 6 cartas. */
export async function GET() {
  try {
    return ok(await getMenusCached());
  } catch {
    return fail(500, "catalog_unavailable", "No pudimos cargar la carta. Inténtalo en un momento.");
  }
}
