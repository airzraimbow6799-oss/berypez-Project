/**
 * F4-01 / F4-05 · Crear una reserva: validar → límite → antibots → recalcular la franja en
 * el servidor → crear con verificación de aforo dentro de la transacción (RPC).
 */
import { z } from "zod";

import { BRANCH_SLUGS, fieldErrors, normalizePhone } from "@/features/checkout/schema";
import type { Branch } from "@/features/checkout/server";
import type { ApiResponse } from "@/lib/api/response";

import { buildSlots } from "./availability";

export const MAX_PARTY = 20;

export const reservationSchema = z.object({
  branchSlug: z.enum(BRANCH_SLUGS, { error: "Elige la sede." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora."),
  partySize: z
    .number()
    .int()
    .min(1, "¿Cuántas personas?")
    .max(MAX_PARTY, `Para más de ${MAX_PARTY} personas, escríbenos por WhatsApp.`),
  area: z.enum(["", "interior", "terraza"]).default(""),
  occasion: z.string().trim().max(60).default(""),
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^9\d{8}$/, "Ingresa un celular de 9 dígitos que empiece con 9.")),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Revisa el correo.")
    .default(""),
  acceptPrivacy: z.boolean().refine((v) => v, "Acepta la política de privacidad para continuar."),
  turnstileToken: z.string().trim().min(1, "Confirma que no eres un robot.").max(2048),
});

export type ReservationDeps = {
  verifyTurnstile: (token: string, ip: string | null) => Promise<boolean>;
  hitRateLimit: (key: string, limit: number, windowSeconds: number) => Promise<boolean>;
  getBranch: (slug: string) => Promise<(Branch & { capacity: number }) | null>;
  getReservedSeats: (branchId: number, date: string) => Promise<Map<string, number>>;
  isBlocked: (branchId: number, date: string) => Promise<boolean>;
  createReservation: (
    input: Record<string, string | number | null>,
  ) => Promise<{ reservationId: number; manageToken: string }>;
};

type Created = { reservationId: number; manageToken: string; startsAt: string };
type Result = { status: number; body: ApiResponse<Created> };

const fail = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): Result => ({
  status,
  body: { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
});

export async function placeReservation(
  input: unknown,
  { ip, now }: { ip: string | null; now: Date },
  deps: ReservationDeps,
): Promise<Result> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    return fail(400, "invalid_input", "Revisa los datos marcados.", fieldErrors(parsed.error));
  }
  const data = parsed.data;

  try {
    const [ipOk, phoneOk] = await Promise.all([
      deps.hitRateLimit(`reserva:ip:${ip ?? "desconocida"}`, 10, 600),
      deps.hitRateLimit(`reserva:cel:${data.phone}`, 5, 600),
    ]);
    if (!ipOk || !phoneOk) {
      return fail(
        429,
        "too_many_requests",
        "Hiciste muchas reservas seguidas. Espera unos minutos.",
      );
    }
    if (!(await deps.verifyTurnstile(data.turnstileToken, ip))) {
      return fail(
        403,
        "turnstile_failed",
        "No pudimos confirmar que no eres un robot. Inténtalo otra vez.",
      );
    }

    const branch = await deps.getBranch(data.branchSlug);
    if (!branch)
      return fail(400, "invalid_input", "Elige una sede.", { branchSlug: "Elige una sede." });

    const [reserved, blocked] = await Promise.all([
      deps.getReservedSeats(branch.id, data.date),
      deps.isBlocked(branch.id, data.date),
    ]);
    const slot = buildSlots({
      date: data.date,
      hours: branch.openingHours,
      capacity: branch.capacity,
      reserved,
      partySize: data.partySize,
      now,
      isBlocked: blocked,
    }).find((s) => s.time === data.time);

    if (!slot) {
      return fail(400, "invalid_input", "Revisa los datos marcados.", {
        time: "Esa hora no está disponible. Elige otra.",
      });
    }
    if (!slot.available) {
      return fail(409, "slot_full", "Esa franja ya no tiene cupo para tu grupo. Elige otra hora.");
    }

    const created = await deps.createReservation({
      branch_id: branch.id,
      starts_at: slot.startsAt,
      party_size: data.partySize,
      area: data.area || null,
      occasion: data.occasion || null,
      customer_name: data.name,
      customer_phone: data.phone,
      customer_email: data.email || null,
    });
    return { status: 201, body: { success: true, data: { ...created, startsAt: slot.startsAt } } };
  } catch (error) {
    if (error instanceof Error && /cupo|no disponible/i.test(error.message)) {
      return fail(409, "slot_full", "Esa franja se acaba de llenar. Elige otra hora.");
    }
    return fail(
      500,
      "reservation_failed",
      "No pudimos registrar tu reserva. Inténtalo de nuevo o escríbenos por WhatsApp.",
    );
  }
}
