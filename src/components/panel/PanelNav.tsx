import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { PanelTabPending } from "@/components/panel/PanelTabPending";
import {
  type PanelSectionKey,
  roleLabel,
  sectionsFor,
  type StaffRole,
} from "@/features/staff/roles";

/** Navegación del panel: muestra solo las secciones que el rol puede ver. */
export function PanelNav({
  current,
  email,
  role,
  demo = false,
}: {
  current?: PanelSectionKey;
  email: string;
  role: StaffRole;
  demo?: boolean;
}) {
  const tabs = sectionsFor(role, demo);
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:w-auto">
        <BrandLogo className="text-marino h-8 w-auto" />
        {/* En celular, una sola fila que se desliza de lado (antes ocupaba tres filas). */}
        <nav aria-label="Panel" className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-auto">
          <ul className="flex gap-1 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={current === tab.key ? "page" : undefined}
                  className={`rounded-pill min-h-tactil inline-flex shrink-0 items-center px-4 font-semibold whitespace-nowrap ${current === tab.key ? "bg-marino text-crema" : "hover:bg-crema text-marino"}`}
                >
                  {tab.label}
                  <PanelTabPending />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="text-tinta-suave text-sm break-all">
        {email} · <span className="font-semibold">{roleLabel(role)}</span>
      </p>
    </header>
  );
}
