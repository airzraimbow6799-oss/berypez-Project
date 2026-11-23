import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security-headers";

// F1-05 · Las fotos de los platos vienen del bucket público `catalog` de Supabase Storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/**
 * Pagos SIMULADOS en el checkout (Yape, Plin y tarjeta de mentira, sin cobrar ni crear pedidos).
 * Mientras estamos en la etapa de propuesta están ENCENDIDOS en todos los entornos, producción
 * incluida, para poder mostrarlos en la web real. Al salir a producción con la pasarela real hay
 * que poner PAYMENTS_DEMO=0 en Vercel (ver docs/plan/06-requisitos-pasarela.md).
 */
const paymentsDemo = process.env.PAYMENTS_DEMO !== "0";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_PAYMENTS_DEMO: paymentsDemo ? "1" : "0" },
  poweredByHeader: false,
  images: {
    // E2E=1 (solo el servidor de pruebas de Playwright): sirve las fotos tal cual. Ya son WebP de
    // ~48 KB; convertirlas a AVIF en el momento saturaba el runner de 2 núcleos y colgaba las páginas.
    // En Vercel no se define, así que producción sigue optimizando con AVIF/WebP.
    unoptimized: process.env.E2E === "1",
    formats: ["image/avif", "image/webp"],
    // Tamaños de la cuadrícula: 2 columnas en celular, 3–4 en escritorio.
    deviceSizes: [360, 414, 640, 768, 1024, 1280],
    imageSizes: [96, 160, 240, 320, 480],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/catalog/**",
          },
        ]
      : [],
  },
  // F5-04 · Cabeceras de seguridad en todas las rutas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          isDev: process.env.NODE_ENV !== "production",
        }),
      },
      {
        // Video y fotos propias: caché larga (los nombres cambian si cambia el archivo).
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
