import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Berypez · Cocina marina y criolla",
    short_name: "Berypez",
    description: "Carta, pedidos y reservas en Lince y Jesús María.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F0",
    theme_color: "#082F49",
    lang: "es-PE",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
