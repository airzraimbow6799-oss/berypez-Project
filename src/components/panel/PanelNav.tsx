import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";

/** Navegación del panel: Pedidos · Reservas. */
export function PanelNav({ current, email }: { current: "pedidos" | "reservas"; email: string }) {
  const tabs = [
    { key: "pedidos", href: "/panel", label: "Pedidos" },
    { key: "reservas", href: "/panel/reservas", label: "Reservas" },
  ] as const;
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <BrandLogo className="text-marino h-8 w-auto" />
        <nav aria-label="Panel">
          <ul className="flex gap-1">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={current === tab.key ? "page" : undefined}
                  className={`rounded-pill min-h-tactil inline-flex items-center px-4 font-semibold ${current === tab.key ? "bg-marino text-crema" : "hover:bg-crema text-marino"}`}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="text-tinta-suave text-sm">{email}</p>
    </header>
  );
}
