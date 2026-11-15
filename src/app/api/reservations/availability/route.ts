import type { NextRequest } from "next/server";
import { z } from "zod";

import { BRANCH_SLUGS } from "@/features/checkout/schema";
import { buildSlots } from "@/features/reservations/availability";
import { MAX_PARTY } from "@/features/reservations/place-reservation";
import {
  getBranchForReservations,
  getReservedSeats,
  isBlocked,
} from "@/features/reservations/server";
import { fail, ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  branch: z.enum(BRANCH_SLUGS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  party: z.coerce.number().int().min(1).max(MAX_PARTY).default(2),
});

/** GET /api/reservations/availability?branch=&date=&party= · Franjas de 30 min con cupo. */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return fail(400, "invalid_input", "Elige sede, fecha y número de personas.");
  }
  try {
    const { branch: slug, date, party } = parsed.data;
    const branch = await getBranchForReservations(slug);
    if (!branch) return fail(404, "branch_not_found", "Esa sede no existe.");
    const [reserved, blocked] = await Promise.all([
      getReservedSeats(branch.id, date),
      isBlocked(branch.id, date),
    ]);
    const slots = buildSlots({
      date,
      hours: branch.openingHours,
      capacity: branch.capacity,
      reserved,
      partySize: party,
      now: new Date(),
      isBlocked: blocked,
    }).map(({ time, available }) => ({ time, available }));
    return ok({ branch: branch.name, date, isBlocked: blocked, slots });
  } catch {
    return fail(
      500,
      "availability_failed",
      "No pudimos cargar los horarios. Inténtalo en un momento.",
    );
  }
}
