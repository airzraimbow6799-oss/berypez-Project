import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuBrowser } from "@/components/catalog/MenuBrowser";
import { getMenuCached } from "@/features/catalog/data/cached";
import { MENU_SLUGS, type MenuPage, type MenuSlug } from "@/types/catalog";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return MENU_SLUGS.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

function isMenuSlug(value: string): value is MenuSlug {
  return (MENU_SLUGS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = isMenuSlug(slug) ? await getMenuCached(slug) : null;
  if (!page) return {};
  return {
    title: page.menu.name,
    description: `${page.menu.description} Pide delivery o recojo en Berypez, Lince y Jesús María.`,
    alternates: { canonical: `/carta/${slug}` },
  };
}

/** F1-13 · Datos estructurados schema.org Menu para Google. */
function menuJsonLd(page: MenuPage): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: page.menu.name,
    inLanguage: "es-PE",
    hasMenuSection: page.sections.map((section) => ({
      "@type": "MenuSection",
      name: section.category.name,
      hasMenuItem: section.products.map((product) => ({
        "@type": "MenuItem",
        name: product.name,
        description: product.description || undefined,
        image: product.image?.url,
        offers: {
          "@type": "Offer",
          price: (product.priceCents / 100).toFixed(2),
          priceCurrency: "PEN",
        },
      })),
    })),
  };
  // Escapar “<” evita que un texto del catálogo cierre la etiqueta <script>.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function MenuRoute({ params }: Params) {
  const { slug } = await params;
  if (!isMenuSlug(slug)) notFound();
  const page = await getMenuCached(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: menuJsonLd(page) }} />

      <nav aria-label="Cartas">
        <ul className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 pb-2">
          {page.menus.map((menu) => {
            const isCurrent = menu.slug === slug;
            return (
              <li key={menu.slug} className="shrink-0">
                <Link
                  href={`/carta/${menu.slug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-pill min-h-tactil inline-flex items-center border px-4 font-semibold whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "border-marino bg-marino text-crema"
                      : "border-borde bg-superficie text-marino hover:border-marino-600"
                  }`}
                >
                  {menu.name.replace("Carta ", "")}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold">{page.menu.name}</h1>
        <p className="text-tinta-suave mt-2 max-w-xl text-lg">{page.menu.description}</p>
      </header>

      <MenuBrowser page={page} />
    </div>
  );
}
