import { branchStatus } from "@/features/checkout/hours";
import { getBranchesAndZones } from "@/features/checkout/server";
import { fail, ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/** GET /api/branches · Sedes con estado abierto/cerrado (F2-02, F2-03) y zonas de reparto. */
export async function GET() {
  try {
    const { branches, zones } = await getBranchesAndZones();
    const now = new Date();
    return ok({
      branches: branches.map((b) => ({
        slug: b.slug,
        name: b.name,
        whatsapp: b.whatsapp,
        status: branchStatus(b.openingHours, now),
        openingHours: b.openingHours,
      })),
      zones: zones.map((z) => ({
        district: z.district,
        feeCents: z.feeCents,
        minOrderCents: z.minOrderCents,
        etaMinutes: z.etaMinutes,
      })),
    });
  } catch {
    return fail(500, "branches_unavailable", "No pudimos cargar las sedes.");
  }
}
