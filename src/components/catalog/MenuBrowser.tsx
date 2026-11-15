"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { toast } from "@/components/ui/Toaster";
import { useCart } from "@/features/cart/store";
import { applyFilters, type MenuFilters, NO_FILTERS } from "@/features/catalog/search";
import { canAddToCart, defaultSelection, toCartInput } from "@/features/catalog/selection";
import type { MenuPage, Product, ProductTag } from "@/types/catalog";

import { ProductCard } from "./ProductCard";
import { QuickView } from "./QuickView";

const TAG_FILTERS: Array<{ tag: ProductTag; label: string }> = [
  { tag: "vegetariano", label: "Vegetariano" },
  { tag: "ninos", label: "Para niños" },
  { tag: "compartir", label: "Para compartir" },
];
const PRICE_LIMIT_CENTS = 4000;
const GRID_SIZES = "(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw";

/** Necesita vista rápida si hay que elegir algo (variante o elección libre). */
function needsQuickView(product: Product): boolean {
  return product.variants.length > 1 || product.choiceGroups.length > 0;
}

/** Barra de secciones fija con scroll-spy: resalta la sección visible. */
function SectionNav({ sections }: { sections: Array<{ slug: string; name: string }> }) {
  const [active, setActive] = useState(sections[0]?.slug);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("seccion-", ""));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const section of sections) {
      const element = document.getElementById(`seccion-${section.slug}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    document
      .getElementById(`nav-${active}`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="Secciones de la carta"
      className="bg-fondo/95 border-borde sticky top-0 z-20 -mx-4 border-b px-4 backdrop-blur md:top-[var(--altura-header)]"
    >
      <ul className="flex [scrollbar-width:none] gap-1 overflow-x-auto py-2">
        {sections.map((section) => (
          <li key={section.slug} className="shrink-0">
            <a
              id={`nav-${section.slug}`}
              href={`#seccion-${section.slug}`}
              aria-current={active === section.slug ? "true" : undefined}
              className={`rounded-pill inline-flex min-h-10 items-center px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                active === section.slug ? "bg-marino text-crema" : "hover:bg-crema-200 text-marino"
              }`}
            >
              {section.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** F1-08 / F1-11 · Carta navegable: filtros, búsqueda, secciones y vista rápida. */
export function MenuBrowser({ page }: { page: MenuPage }) {
  const add = useCart((state) => state.add);
  const [filters, setFilters] = useState<MenuFilters>(NO_FILTERS);
  const [selected, setSelected] = useState<Product | null>(null);

  const sections = useMemo(
    () =>
      page.sections
        .map((section) => ({ ...section, products: applyFilters(section.products, filters) }))
        .filter((section) => section.products.length > 0),
    [page.sections, filters],
  );
  const total = sections.reduce((sum, s) => sum + s.products.length, 0);
  const isFiltering = filters !== NO_FILTERS;

  const quickAdd = (product: Product) => {
    const selection = defaultSelection(product);
    if (needsQuickView(product) || !canAddToCart(product, selection)) {
      setSelected(product);
      return;
    }
    add(toCartInput(product, selection, ""), 1);
    navigator.vibrate?.(20);
    toast.success(`Agregaste ${product.name}`, {
      action: { label: "Ver carrito", onClick: () => window.location.assign("/carrito") },
    });
  };

  const toggleTag = (tag: ProductTag, on: boolean) =>
    setFilters((f) => ({ ...f, tags: on ? [...f.tags, tag] : f.tags.filter((t) => t !== tag) }));

  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        <div className="relative max-w-md">
          <label htmlFor="buscar-carta" className="sr-only">
            Buscar en la carta
          </label>
          <Search
            aria-hidden="true"
            className="text-tinta-suave pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            id="buscar-carta"
            type="search"
            value={filters.query}
            onChange={(event) => setFilters((f) => ({ ...f, query: event.target.value }))}
            placeholder="Busca un plato: ceviche, lomo, chicha…"
            autoComplete="off"
            className="border-borde bg-superficie focus-visible:border-marino-600 min-h-tactil rounded-pill w-full border pr-12 pl-12"
          />
          {filters.query ? (
            <IconButton
              label="Borrar búsqueda"
              icon={<X aria-hidden="true" className="size-5" />}
              onClick={() => setFilters((f) => ({ ...f, query: "" }))}
              className="absolute top-0 right-0"
            />
          ) : null}
        </div>
        <div
          className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0"
          role="group"
          aria-label="Filtros"
        >
          <Chip
            pressed={filters.sinPicante}
            onPressedChange={(on) => setFilters((f) => ({ ...f, sinPicante: on }))}
          >
            Sin picante
          </Chip>
          {TAG_FILTERS.map(({ tag, label }) => (
            <Chip
              key={tag}
              pressed={filters.tags.includes(tag)}
              onPressedChange={(on) => toggleTag(tag, on)}
            >
              {label}
            </Chip>
          ))}
          <Chip
            pressed={filters.maxPriceCents !== null}
            onPressedChange={(on) =>
              setFilters((f) => ({ ...f, maxPriceCents: on ? PRICE_LIMIT_CENTS : null }))
            }
          >
            Hasta S/ 40
          </Chip>
        </div>
        <p aria-live="polite" className="text-tinta-suave text-sm">
          {isFiltering ? (total === 1 ? "1 plato encontrado" : `${total} platos encontrados`) : ""}
        </p>
      </div>

      {sections.length > 0 ? (
        <SectionNav
          sections={sections.map((s) => ({ slug: s.category.slug, name: s.category.name }))}
        />
      ) : (
        <div className="border-borde bg-superficie mt-6 rounded-md border p-8 text-center">
          <p className="text-lg font-semibold">No encontramos platos con esa búsqueda.</p>
          <p className="text-tinta-suave mt-1">Prueba con otra palabra o quita algún filtro.</p>
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="text-marino-600 min-h-tactil mt-3 font-semibold underline underline-offset-4"
          >
            Quitar filtros
          </button>
        </div>
      )}

      {sections.map((section, sectionIndex) => (
        <section
          key={section.category.id}
          id={`seccion-${section.category.slug}`}
          aria-labelledby={`titulo-${section.category.slug}`}
          className="scroll-mt-40 pt-8"
        >
          <h2 id={`titulo-${section.category.slug}`} className="text-2xl font-semibold">
            {section.category.name}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {section.products.map((product, index) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  sizes={GRID_SIZES}
                  priority={sectionIndex === 0 && index < 2}
                  onOpen={() => setSelected(product)}
                  action={
                    <IconButton
                      tone="aji"
                      label={
                        needsQuickView(product)
                          ? `Elegir opciones de ${product.name}`
                          : `Agregar ${product.name}`
                      }
                      icon={<Plus aria-hidden="true" className="size-6" />}
                      disabled={!product.isAvailable}
                      onClick={() => quickAdd(product)}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <QuickView product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
