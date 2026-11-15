import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

/** Vitrina para QA (F0-09 / F0-Q5). Solo en local y en previews, nunca en producción. */
export default function ComponentsPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }
  return <Showcase />;
}
