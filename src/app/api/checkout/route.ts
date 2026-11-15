import { NextResponse, type NextRequest } from "next/server";

import { placeOrder } from "@/features/checkout/place-order";
import {
  createOrder,
  getBranchesAndZones,
  getProductsByIds,
  hitRateLimit,
} from "@/features/checkout/server";
import { clientIp, readJson } from "@/lib/api/request";
import { verifyTurnstile } from "@/lib/turnstile";

/** POST /api/checkout · Crea el pedido (F2-04). Ver reglas en features/checkout/place-order.ts. */
export async function POST(request: NextRequest) {
  const result = await placeOrder(
    await readJson(request),
    { ip: clientIp(request), now: new Date() },
    { verifyTurnstile, hitRateLimit, getBranchesAndZones, getProductsByIds, createOrder },
  );
  return NextResponse.json(result.body, { status: result.status });
}
