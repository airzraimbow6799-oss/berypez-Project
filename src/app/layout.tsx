import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

// Dos familias como máximo (presupuesto de rendimiento). Variables: un solo archivo por familia.
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
    <html lang="es-PE" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
