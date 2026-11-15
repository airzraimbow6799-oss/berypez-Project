import type { MetadataRoute } from "next";

/** No indexar el panel, la API ni las páginas personales (pedidos, reservas, checkout). */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/panel",
        "/api/",
        "/checkout",
        "/carrito",
        "/pedido/",
        "/reservas/",
        "/componentes",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
