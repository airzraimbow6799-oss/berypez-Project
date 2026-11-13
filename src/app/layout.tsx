import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Berypez – Cocina marina y criolla",
    template: "%s | Berypez",
  },
  description: "Carta, pedidos y reservas de Berypez, cevichería con sedes en Lince y Jesús María.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
