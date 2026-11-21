import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
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
}: {
  current?: PanelSectionKey;
  email: string;
  role: StaffRole;
}) {
  const tabs = sectionsFor(role);
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
      <p className="text-tinta-suave text-sm">
        {email} · <span className="font-semibold">{roleLabel(role)}</span>
      </p>
    </header>
  );
}
