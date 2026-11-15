import Link from "next/link";

import { MENU_LINKS } from "@/config/site";

/** Portada provisional: la versión completa (HERO, plato estrella, sedes) llega en F1-06/F1-07. */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <p className="text-rocoto-texto text-sm font-semibold tracking-wide uppercase">
        Lince · Jesús María · desde 2010
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold">Sabor marino con 14 años de cariño</h1>
      <p className="text-tinta-suave mt-4 max-w-xl text-lg">
        ¿Qué se te antoja hoy? Pide delivery, recoge en tu sede o reserva tu mesa.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/carta/marina"
          className="bg-aji text-marino hover:bg-aji-600 min-h-tactil rounded-pill inline-flex items-center px-6 font-semibold shadow-md transition-colors"
        >
          Pedir ahora
        </Link>
        <Link
          href="/reservas"
          className="border-marino text-marino hover:bg-marino hover:text-crema min-h-tactil rounded-pill inline-flex items-center border-2 px-6 font-semibold transition-colors"
        >
          Reservar mesa
        </Link>
      </div>

      <section aria-labelledby="cartas" className="mt-16">
        <h2 id="cartas" className="text-2xl font-semibold">
          Nuestras cartas
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {MENU_LINKS.map((menu) => (
            <li key={menu.slug}>
              <Link
                href={`/carta/${menu.slug}`}
                className="border-borde bg-superficie hover:border-marino-600 min-h-tactil rounded-pill inline-flex items-center border px-5 font-medium transition-colors"
              >
                {menu.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
