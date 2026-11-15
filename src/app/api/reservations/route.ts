import { NextResponse, type NextRequest } from "next/server";

import { hitRateLimit } from "@/features/checkout/server";
import { placeReservation } from "@/features/reservations/place-reservation";
import {
  createReservation,
  getBranchForReservations,
  getReservedSeats,
  isBlocked,
} from "@/features/reservations/server";
import { clientIp, readJson } from "@/lib/api/request";
import { verifyTurnstile } from "@/lib/turnstile";

/** POST /api/reservations · Crea una reserva sin sobreventa (F4-01). */
export async function POST(request: NextRequest) {
  const result = await placeReservation(
    await readJson(request),
    { ip: clientIp(request), now: new Date() },
    {
      verifyTurnstile,
      hitRateLimit,
      getBranch: getBranchForReservations,
      getReservedSeats,
      isBlocked,
      createReservation,
    },
  );
  return NextResponse.json(result.body, { status: result.status });
}
