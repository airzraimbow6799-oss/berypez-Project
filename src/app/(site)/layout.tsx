import { Suspense } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavigationLoader } from "@/components/layout/NavigationLoader";
import { PageLoadedFlag } from "@/components/layout/PageLoadedFlag";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { LazyToaster } from "@/components/ui/LazyToaster";

/** Layout del sitio público. El panel (/panel) tiene su propio layout, sin esto. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Dibujo de mariscos detrás de todo el sitio público (decorativo, ver .fondo-mar). */}
      <div aria-hidden="true" className="fondo-mar" />
      <PageLoadedFlag />
      <SkipLink />
      <SiteHeader />
      {/* overflow-x-clip: lo que entra desde un costado (revelado lateral, fotos inclinadas) no
          abre scroll horizontal. clip (no hidden) no crea contenedor de scroll: el parallax y los
          elementos sticky siguen funcionando. */}
      <main id="contenido" tabIndex={-1} className="overflow-x-clip outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileNav />
      <LazyToaster />
      <CookieConsent />
      {/* useSearchParams exige Suspense para no volver dinámicas las páginas estáticas. */}
      <Suspense fallback={null}>
        <NavigationLoader />
      </Suspense>
    </>
  );
}
