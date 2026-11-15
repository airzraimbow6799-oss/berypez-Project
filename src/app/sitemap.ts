import type { MetadataRoute } from "next";

import { MENU_SLUGS } from "@/types/catalog";

/** F1-13 · Mapa del sitio con las páginas públicas que conviene indexar. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...MENU_SLUGS.map((slug) => ({
      url: `${base}/carta/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    { url: `${base}/reservas`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...["terminos", "privacidad", "devoluciones", "libro-de-reclamaciones"].map((path) => ({
      url: `${base}/${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
