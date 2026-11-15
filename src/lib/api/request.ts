import type { NextRequest } from "next/server";

/** IP del cliente detrás del proxy de Vercel (primer valor de x-forwarded-for). */
export function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

/** JSON del cuerpo o null si no es JSON válido (no lanza). */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
