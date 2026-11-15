import Link from "next/link";

import { BRANCHES, LEGAL_LINKS, MENU_LINKS, PAYMENT_METHODS } from "@/config/site";

import { Logo } from "./Logo";
import { Wave } from "./Wave";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16">
      <Wave />
      <div className="sobre-marino bg-marino text-crema -mt-px">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="crema" />
            <p className="text-crema/85 mt-3 max-w-xs">
              Cocina marina y criolla desde 2010. Berla y Julio, y todo el equipo, en Lince y Jesús
              María.
            </p>
          </div>

          <section aria-labelledby="footer-sedes">
            <h2 id="footer-sedes" className="text-aji text-lg">
              Sedes
            </h2>
            <ul className="mt-3 space-y-3">
              {BRANCHES.map((branch) => (
                <li key={branch.slug}>
                  <p className="font-semibold">{branch.name}</p>
                  {branch.address ? <p className="text-crema/85">{branch.address}</p> : null}
                  {branch.hours ? <p className="text-crema/85">{branch.hours}</p> : null}
                  {branch.phone ? (
                    <a href={`tel:${branch.phone}`} className="underline underline-offset-4">
                      {branch.phone}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <nav aria-labelledby="footer-cartas">
            <h2 id="footer-cartas" className="text-aji text-lg">
              Cartas
            </h2>
            <ul className="mt-3 space-y-1">
              {MENU_LINKS.map((menu) => (
                <li key={menu.slug}>
                  <Link
                    href={`/carta/${menu.slug}`}
                    className="inline-flex min-h-10 items-center hover:underline"
                  >
                    {menu.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="text-aji text-lg">
              Legal
            </h2>
            <ul className="mt-3 space-y-1">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-crema/15 border-t">
          {/* pb extra en móvil: deja ver el pie sobre la barra inferior fija. */}
          <div className="text-crema/85 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-24 text-sm md:pb-5">
            <p>© {year} Berypez</p>
            <p>
              <span className="sr-only">Medios de pago: </span>
              {PAYMENT_METHODS.join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
