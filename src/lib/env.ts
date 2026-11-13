import { z } from "zod";

const required = (name: string) =>
  z.string({ error: `${name} es obligatoria` }).min(1, `${name} es obligatoria`);

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ error: "NEXT_PUBLIC_SITE_URL debe ser una URL" }),
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL debe ser una URL",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: required("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  RESEND_API_KEY: required("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: required("RESEND_FROM_EMAIL"),
  TURNSTILE_SECRET_KEY: required("TURNSTILE_SECRET_KEY"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

type RawEnv = Record<string, string | undefined>;

function parseOrThrow<T>(schema: z.ZodType<T>, source: RawEnv, scope: string): T {
  const result = schema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const problems = result.error.issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Variables de entorno (${scope}) inválidas:\n${problems}`);
}

/** Variables seguras para el navegador. Nunca incluye secretos. */
export function parsePublicEnv(source: RawEnv): PublicEnv {
  return parseOrThrow(publicSchema, source, "públicas");
}

/** Variables del servidor (incluye secretos). Solo usar en `/api/*` o código de servidor. */
export function parseServerEnv(source: RawEnv): ServerEnv {
  return parseOrThrow(serverSchema, source, "servidor");
}
