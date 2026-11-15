/** F4-04 · Libro de Reclamaciones virtual (Ley 29571). Validación, antibots y registro. */
import { z } from "zod";

import { BRANCH_SLUGS, fieldErrors, normalizePhone } from "@/features/checkout/schema";
import type { ApiResponse } from "@/lib/api/response";

export const complaintSchema = z
  .object({
    kind: z.enum(["reclamo", "queja"], { error: "Elige reclamo o queja." }),
    branchSlug: z.enum(["", ...BRANCH_SLUGS]).default(""),
    name: z.string().trim().min(2, "Escribe tu nombre completo.").max(120),
    documentType: z.enum(["DNI", "CE", "PASAPORTE", "RUC"], {
      error: "Elige el tipo de documento.",
    }),
    documentNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{6,15}$/, "Revisa el número de documento."),
    phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^9\d{8}$/, "Ingresa un celular de 9 dígitos que empiece con 9.")),
    email: z.email("Escribe un correo válido: ahí te llega la constancia.").max(254),
    address: z.string().trim().max(200).default(""),
    isMinor: z.boolean().default(false),
    guardianName: z.string().trim().max(120).default(""),
    itemType: z.enum(["producto", "servicio"], { error: "Elige producto o servicio." }),
    amountCents: z.number().int().min(0).max(10_000_000).nullable().default(null),
    description: z
      .string()
      .trim()
      .min(10, "Cuéntanos qué pasó (al menos 10 caracteres).")
      .max(2000),
    request: z.string().trim().min(5, "Cuéntanos qué solicitas.").max(1000),
    turnstileToken: z.string().trim().min(1, "Confirma que no eres un robot.").max(2048),
  })
  .superRefine((data, ctx) => {
    if (data.isMinor && data.guardianName.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianName"],
        message: "Escribe el nombre del padre, madre o apoderado.",
      });
    }
  });

export type ComplaintDeps = {
  verifyTurnstile: (token: string, ip: string | null) => Promise<boolean>;
  hitRateLimit: (key: string, limit: number, windowSeconds: number) => Promise<boolean>;
  getBranchId: (slug: string) => Promise<number | null>;
  insertComplaint: (
    row: Record<string, string | number | boolean | null>,
  ) => Promise<{ number: number; createdAt: string }>;
};

type Result = { status: number; body: ApiResponse<{ number: number; createdAt: string }> };

export async function placeComplaint(
  input: unknown,
  ip: string | null,
  deps: ComplaintDeps,
): Promise<Result> {
  const parsed = complaintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "invalid_input",
          message: "Revisa los datos marcados.",
          fields: fieldErrors(parsed.error),
        },
      },
    };
  }
  const d = parsed.data;
  try {
    if (!(await deps.hitRateLimit(`reclamo:ip:${ip ?? "desconocida"}`, 5, 3600))) {
      return {
        status: 429,
        body: {
          success: false,
          error: {
            code: "too_many_requests",
            message: "Demasiados envíos seguidos. Inténtalo en una hora.",
          },
        },
      };
    }
    if (!(await deps.verifyTurnstile(d.turnstileToken, ip))) {
      return {
        status: 403,
        body: {
          success: false,
          error: {
            code: "turnstile_failed",
            message: "No pudimos confirmar que no eres un robot. Inténtalo otra vez.",
          },
        },
      };
    }
    const created = await deps.insertComplaint({
      kind: d.kind,
      branch_id: d.branchSlug ? await deps.getBranchId(d.branchSlug) : null,
      customer_name: d.name,
      document_type: d.documentType,
      document_number: d.documentNumber,
      customer_phone: d.phone,
      customer_email: d.email,
      address: d.address || null,
      is_minor: d.isMinor,
      guardian_name: d.isMinor ? d.guardianName : null,
      item_type: d.itemType,
      amount_cents: d.amountCents,
      description: d.description,
      request: d.request,
    });
    return { status: 201, body: { success: true, data: created } };
  } catch {
    return {
      status: 500,
      body: {
        success: false,
        error: {
          code: "complaint_failed",
          message: "No pudimos registrar tu reclamo. Inténtalo de nuevo o acércate a la sede.",
        },
      },
    };
  }
}
