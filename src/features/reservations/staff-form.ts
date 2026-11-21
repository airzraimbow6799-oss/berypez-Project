import { z } from "zod";

import { MAX_PARTY_SIZE } from "./capacity";

/**
 * Formulario «Nueva reserva» del panel (llamada o WhatsApp). Es el contrato que usará el
 * backend real (B-A1): mismas reglas que la reserva por la web.
 */

export const RESERVATION_BRANCHES = ["Lince", "Jesús María"] as const;
export const STAFF_SOURCES = ["phone", "whatsapp"] as const;
export type ReservationSource = "web" | (typeof STAFF_SOURCES)[number];

export const SOURCE_LABELS: Record<ReservationSource, string> = {
  web: "Web",
  phone: "Llamada",
  whatsapp: "WhatsApp",
};

export const newReservationSchema = z.object({
  branch: z.enum(RESERVATION_BRANCHES, { error: "Elige la sede." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige el día."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora."),
  partySize: z
    .number({ error: "Indica cuántas personas." })
    .int()
    .min(1, "Mínimo 1 persona.")
    .max(MAX_PARTY_SIZE, `Máximo ${MAX_PARTY_SIZE} personas.`),
  area: z.enum(["interior", "terraza", "cualquiera"], { error: "Elige la zona." }),
  name: z.string().trim().min(2, "Escribe el nombre.").max(80, "El nombre es muy largo."),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "El celular tiene 9 dígitos y empieza con 9."),
  email: z
    .string()
    .trim()
    .max(254, "El correo es muy largo.")
    .refine((v) => v === "" || z.email().safeParse(v).success, "El correo no es válido."),
  notes: z.string().trim().max(200, "La observación es muy larga."),
  source: z.enum(STAFF_SOURCES, { error: "Indica si fue llamada o WhatsApp." }),
});
export type NewReservationInput = z.input<typeof newReservationSchema>;
export type NewReservation = z.output<typeof newReservationSchema>;

/** Errores por campo (primer mensaje de cada uno), listos para mostrar bajo cada campo. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
