import { MobileNav } from "@/components/layout/MobileNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { Toaster } from "@/components/ui/Toaster";

/** Layout del sitio público. El panel (/panel) tiene su propio layout, sin esto. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileNav />
      <Toaster />
    </>
  );
}
