import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Inter } from "next/font/google";

import "./globals.css";

// Dos familias para todo el texto (presupuesto de rendimiento) y una manuscrita de acento.
// Variables: un solo archivo por familia.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Acento manuscrito (.acento-mano): solo 1–2 palabras por pantalla, como escrito en la pizarra
// del local. Un peso y sin precarga, para no competir con la foto o el titular de la portada.
const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  weight: "700",
  preload: false,
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: {
    default: "Berypez",
    template: "%s | Berypez",
  },
  description:
    "Cocina marina y criolla desde 2010. Pide delivery o recojo en Lince y Jesús María, y reserva tu mesa.",
};

export const viewport: Viewport = {
  themeColor: "#082f49",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE" className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
