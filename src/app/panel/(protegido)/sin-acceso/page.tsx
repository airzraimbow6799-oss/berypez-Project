import Link from "next/link";

import { PanelNav } from "@/components/panel/PanelNav";
import { homeFor, roleLabel } from "@/features/staff/roles";
import { requireStaff } from "@/features/staff/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sin acceso" };

/** A donde llega el personal que pide una sección que su rol no puede ver. */
export default async function NoAccessPage() {
  const session = await requireStaff();
  const home = homeFor(session.role);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <PanelNav email={session.email} role={session.role} />
      <section className="mt-10 max-w-xl" aria-labelledby="sin-acceso">
        <h1 id="sin-acceso" className="text-marino text-3xl">
          No tienes acceso a esta sección
        </h1>
        <p className="text-tinta-suave mt-3">
          Tu rol es <strong>{roleLabel(session.role)}</strong> y esta sección es de otro rol. Si la
          necesitas, pídele a la administración que cambie tu rol.
        </p>
        {home ? (
          <Link
            href={home.href}
            className="rounded-pill bg-marino text-crema min-h-tactil mt-6 inline-flex items-center px-5 font-semibold"
          >
            Volver a {home.label}
          </Link>
        ) : null}
      </section>
    </main>
  );
}
