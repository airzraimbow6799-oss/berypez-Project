"use client";

import { CalendarDays, MessageCircle, Search, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { primaryWhatsapp, whatsappUrl } from "@/config/site";

interface Item {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
}

function buildItems(whatsapp: string | null): Item[] {
  const items: Item[] = [
    { href: "/carta/marina", label: "Carta", Icon: UtensilsCrossed },
    { href: "/buscar", label: "Buscar", Icon: Search },
    { href: "/carrito", label: "Carrito", Icon: ShoppingBag },
    { href: "/reservas", label: "Reservar", Icon: CalendarDays },
  ];
  if (whatsapp) {
    items.push({
      href: whatsappUrl(whatsapp, "Hola Berypez, quisiera hacer una consulta."),
      label: "WhatsApp",
      Icon: MessageCircle,
      external: true,
    });
  }
  return items;
}

/** Barra inferior fija en celular (propuesta §7): texto + ícono, 48 px de alto. */
export function MobileNav({ whatsapp = primaryWhatsapp() }: { whatsapp?: string | null }) {
  const pathname = usePathname();
  const items = buildItems(whatsapp);

  return (
    <nav
      aria-label="Accesos rápidos"
      className="border-borde bg-superficie/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, Icon, external }) => {
          const current = !external && pathname.startsWith(href.split("/").slice(0, 2).join("/"));
          const className = `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
            current ? "text-marino" : "text-tinta-suave hover:text-marino"
          }`;
          const content = (
            <>
              <Icon aria-hidden="true" className={`size-6 ${current ? "text-aji-600" : ""}`} />
              {label}
            </>
          );
          return (
            <li key={label} className="flex flex-1">
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <Link href={href} aria-current={current ? "page" : undefined} className={className}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
