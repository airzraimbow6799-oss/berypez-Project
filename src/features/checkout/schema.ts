/** F2-04 / F2-10 · Esquema del checkout compartido por el formulario y la API (mensajes en español). */
import { z } from "zod";

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "").replace(/^\+?51(?=9\d{8}$)/, "");
}

const optionalText = (max: number) => z.string().trim().max(max).default("");

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().min(1).max(50),
  choices: z.record(z.string().max(60), z.string().max(80)).default({}),
  note: optionalText(200),
});

export const BRANCH_SLUGS = ["lince", "jesus-maria"] as const;
export const PAYMENT_METHODS = ["cash", "yape", "plin", "card"] as const;

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe tu nombre.").max(80, "El nombre es muy largo."),
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
    modality: z.enum(["delivery", "pickup"], { error: "Elige delivery o recojo." }),
    branchSlug: z.enum(BRANCH_SLUGS, { error: "Elige la sede." }),
    district: optionalText(60),
    address: optionalText(200),
    addressReference: optionalText(120),
    scheduledFor: z
      .string()
      .trim()
      .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Revisa la fecha y hora.")
      .default(""),
    paymentMethod: z.enum(PAYMENT_METHODS, { error: "Elige cómo vas a pagar." }),
    cashChangeForCents: z.number().int().min(0).max(100_000_00).nullable().default(null),
    notes: optionalText(500),
    acceptTerms: z.boolean().refine((v) => v, "Acepta los términos para continuar."),
    turnstileToken: z.string().trim().min(1, "Confirma que no eres un robot.").max(2048),
    items: z.array(cartItemSchema).min(1, "Tu carrito está vacío.").max(30),
  })
  .superRefine((data, ctx) => {
    if (data.modality !== "delivery") return;
    if (!data.district) {
      ctx.addIssue({ code: "custom", path: ["district"], message: "Elige tu distrito." });
    }
    if (data.address.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Escribe la dirección de entrega.",
      });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/** Primer error de cada campo, listo para mostrar junto al campo. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}
