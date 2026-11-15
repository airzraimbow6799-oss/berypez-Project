import { z } from "zod";

const required = (name: string) =>
  z.string({ error: `${name} es obligatoria` }).min(1, `${name} es obligatoria`);

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ error: "NEXT_PUBLIC_SITE_URL debe ser una URL" }),
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL debe ser una URL",
  }),
  // Va al navegador: nunca puede ser una clave secreta.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").refine(
    (value) => !value.startsWith("sb_secret_"),
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contiene una clave secreta: usa la publishable",
  ),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: required("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
});

const serverSchema = publicSchema.extend({
  // SECRETA: salta RLS. Solo en /api/* y scripts del servidor.
  SUPABASE_SECRET_KEY: required("SUPABASE_SECRET_KEY").refine(
    (value) => !value.startsWith("sb_publishable_"),
    "SUPABASE_SECRET_KEY debe ser la clave secreta (sb_secret_…), no la publishable",
  ),
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

/**
 * Lee las variables públicas de `process.env`. Next.js solo incluye en el bundle del
 * navegador las variables referenciadas de forma literal, por eso se nombran una por una.
 */
export function readPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}

/** Variables del servidor (incluye secretos). Solo usar en `/api/*` o código de servidor. */
export function parseServerEnv(source: RawEnv): ServerEnv {
  return parseOrThrow(serverSchema, source, "servidor");
}
