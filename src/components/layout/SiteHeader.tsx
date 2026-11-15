import Link from "next/link";

import { BRANCHES, MAIN_NAV, PAYMENT_METHODS } from "@/config/site";

import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { ModeSelector } from "./ModeSelector";

/** Barra superior marino: sedes y medios de pago. El estado “abierto / cierra” llega en F2-03. */
function TopBar() {
  return (
    <div className="sobre-marino bg-marino text-crema">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-sm">
        <p>
          Cevichería en <strong>{BRANCHES.map((b) => b.name).join(" y ")}</strong>
        </p>
        <p className="hidden sm:block">Pagas con {PAYMENT_METHODS.join(" · ")}</p>
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="z-30 md:sticky md:top-0">
      <TopBar />
      <div className="bg-fondo/95 border-borde border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-crema-200 min-h-tactil rounded-pill inline-flex items-center px-4 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ModeSelector />
            </div>
            <CartButton />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:hidden">
          <ModeSelector />
        </div>
      </div>
    </header>
  );
}
