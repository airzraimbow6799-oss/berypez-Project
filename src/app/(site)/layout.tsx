import { Suspense } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavigationLoader } from "@/components/layout/NavigationLoader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { Toaster } from "@/components/ui/Toaster";

/** Layout del sitio público. El panel (/panel) tiene su propio layout, sin esto. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Dibujo de mariscos detrás de todo el sitio público (decorativo, ver .fondo-mar). */}
      <div aria-hidden="true" className="fondo-mar" />
      <SkipLink />
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileNav />
      <Toaster />
      <CookieConsent />
      {/* useSearchParams exige Suspense para no volver dinámicas las páginas estáticas. */}
      <Suspense fallback={null}>
        <NavigationLoader />
      </Suspense>
    </>
  );
}
