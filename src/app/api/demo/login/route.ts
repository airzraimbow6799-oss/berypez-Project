import { NextResponse } from "next/server";
import { z } from "zod";

import { DEMO_COOKIE, demoAccountForCredentials, isDemoPanel } from "@/features/demo/config";

const bodySchema = z.object({ email: z.string().max(120), password: z.string().max(120) });

/** El modo demostración apagado responde como si la ruta no existiera. */
const notFound = () => new NextResponse(null, { status: 404 });

/**
 * POST /api/demo/login · Entra al panel con una cuenta simulada (solo modo demostración).
 * Guarda el rol en una cookie: no hay Supabase ni datos reales de por medio.
 */
export async function POST(request: Request) {
  if (!isDemoPanel()) return notFound();
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  const account = body.success
    ? demoAccountForCredentials(body.data.email, body.data.password)
    : undefined;
  if (!account) {
    return NextResponse.json(
      { error: { code: "invalid_credentials", message: "Correo o contraseña incorrectos." } },
      { status: 401 },
    );
  }
  const response = NextResponse.json({ data: { role: account.role } });
  response.cookies.set(DEMO_COOKIE, account.role, {
    httpOnly: true,
    sameSite: "lax",
    // Solo por HTTPS: en http://localhost (pruebas locales) el navegador descartaría la cookie.
    secure:
      new URL(request.url).protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

/** DELETE /api/demo/login · Sale de la sesión simulada. */
export async function DELETE() {
  if (!isDemoPanel()) return notFound();
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
