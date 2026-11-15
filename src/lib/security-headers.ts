/**
 * F5-04 · Cabeceras de seguridad. La CSP lista solo los orígenes que la web usa:
 * Supabase (datos, fotos y Realtime), Cloudflare Turnstile, GA4 (solo con consentimiento)
 * y Vercel (comentarios en previews).
 *
 * Nota: script-src incluye 'unsafe-inline' porque Next.js inyecta scripts en línea y usar
 * nonces volvería dinámicas todas las páginas (se perdería el ISR de la carta). Se compensa
 * con orígenes acotados, sin 'unsafe-eval' en producción y con frame-ancestors 'none'.
 */
type HeaderOptions = { supabaseUrl: string | undefined; isDev: boolean };

export function contentSecurityPolicy({ supabaseUrl, isDev }: HeaderOptions): string {
  const supabase = supabaseUrl ? new URL(supabaseUrl).host : "";
  const supabaseHttps = supabase ? `https://${supabase}` : "";
  const supabaseWss = supabase ? `wss://${supabase}` : "";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://vercel.live",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      supabaseHttps,
      "https://www.googletagmanager.com",
      "https://vercel.live",
      "https://vercel.com",
    ],
    "font-src": ["'self'", "data:", "https://vercel.live"],
    "media-src": ["'self'"],
    "connect-src": [
      "'self'",
      supabaseHttps,
      supabaseWss,
      "https://challenges.cloudflare.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.googletagmanager.com",
      "https://vercel.live",
      "wss://ws-us3.pusher.com",
    ],
    "frame-src": ["https://challenges.cloudflare.com", "https://vercel.live"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.filter(Boolean).join(" ")}`)
    .join("; ");
  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

export function securityHeaders(options: HeaderOptions): Array<{ key: string; value: string }> {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), browsing-topics=()",
    },
  ];
}
