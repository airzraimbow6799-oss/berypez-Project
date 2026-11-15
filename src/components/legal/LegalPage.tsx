import type { ReactNode } from "react";

import { COMPANY } from "@/config/legal";

/** Plantilla de las páginas legales: título, fecha y texto legible (máx. 70 caracteres por línea). */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-8 pb-16 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="text-tinta-suave text-sm">Última actualización: {COMPANY.updatedAt}</p>
      {children}
      <p className="text-tinta-suave border-borde mt-10 border-t pt-4 text-sm">
        {COMPANY.legalName} · {COMPANY.ruc} · {COMPANY.address}
      </p>
    </article>
  );
}
