import { NextResponse, type NextRequest } from "next/server";

import { hitRateLimit } from "@/features/checkout/server";
import { placeComplaint } from "@/features/complaints/place-complaint";
import { clientIp, readJson } from "@/lib/api/request";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/turnstile";

/** POST /api/complaints · Libro de Reclamaciones (F4-04). Solo el servidor escribe. */
export async function POST(request: NextRequest) {
  const result = await placeComplaint(await readJson(request), clientIp(request), {
    verifyTurnstile,
    hitRateLimit,
    getBranchId: async (slug) => {
      const { data } = await createServiceClient()
        .from("branches")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      return data?.id ?? null;
    },
    insertComplaint: async (row) => {
      const { data, error } = await createServiceClient()
        .from("complaints")
        .insert(row as never)
        .select("number, created_at")
        .single();
      if (error || !data) throw new Error(error?.message ?? "sin datos");
      return { number: data.number, createdAt: data.created_at };
    },
  });
  return NextResponse.json(result.body, { status: result.status });
}
