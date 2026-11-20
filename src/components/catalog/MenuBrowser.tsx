"use client";

import { Search, X } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";

import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { toast } from "@/components/ui/Toaster";
import { flyToCart } from "@/features/cart/fly-to-cart";
import { morphTo } from "@/features/motion/view-transition";
import { useCart } from "@/features/cart/store";
import {
  applyFilters,
  availableFilters,
  type MenuFilters,
  NO_FILTERS,
} from "@/features/catalog/search";
import { canAddToCart, defaultSelection, toCartInput } from "@/features/catalog/selection";
import type { MenuPage, Product, ProductTag } from "@/types/catalog";

import { ProductCard } from "./ProductCard";
import { SectionNav } from "./SectionNav";
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
  // QA-001: solo se ofrecen los filtros que cambian algo en ESTA carta.
  const offered = useMemo(
    () =>
      availableFilters(
        page.sections.flatMap((section) => section.products),
        TAG_FILTERS.map((f) => f.tag),
        PRICE_LIMIT_CENTS,
      ),
    [page.sections],
  );
  const tagFilters = TAG_FILTERS.filter((f) => offered.tags.includes(f.tag));
  const hasFilters = offered.sinPicante || tagFilters.length > 0 || offered.maxPrice;
  const total = sections.reduce((sum, s) => sum + s.products.length, 0);
  const isFiltering = filters !== NO_FILTERS;

  const quickAdd = (product: Product, origin: Element | null) => {
    const selection = defaultSelection(product);
    if (needsQuickView(product) || !canAddToCart(product, selection)) {
      setSelected(product);
      return;
    }
    add(toCartInput(product, selection, ""), 1);
    navigator.vibrate?.(20);
    flyToCart(origin, product.image?.url);
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
        {hasFilters ? (
          <div
            className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0"
            role="group"
            aria-label="Filtros"
          >
            {offered.sinPicante ? (
              <Chip
                pressed={filters.sinPicante}
                onPressedChange={(on) => setFilters((f) => ({ ...f, sinPicante: on }))}
              >
                Sin picante
              </Chip>
            ) : null}
            {tagFilters.map(({ tag, label }) => (
              <Chip
                key={tag}
                pressed={filters.tags.includes(tag)}
                onPressedChange={(on) => toggleTag(tag, on)}
              >
                {label}
              </Chip>
            ))}
            {offered.maxPrice ? (
              <Chip
                pressed={filters.maxPriceCents !== null}
                onPressedChange={(on) =>
                  setFilters((f) => ({ ...f, maxPriceCents: on ? PRICE_LIMIT_CENTS : null }))
                }
              >
                Hasta S/ 40
              </Chip>
            ) : null}
          </div>
        ) : null}
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
          tabIndex={-1}
          className="scroll-mt-40 pt-8 focus:outline-none"
        >
          <h2 id={`titulo-${section.category.slug}`} data-reveal className="text-2xl font-semibold">
            {section.category.name}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {section.products.map((product, index) => (
              // QA-006: la tarjeta ES el <li> y el «+» es CSS (icono-mas): ~4 nodos menos por plato.
              <ProductCard
                key={product.id}
                as="li"
                reveal
                style={{ "--i": index % 4 } as CSSProperties}
                product={product}
                sizes={GRID_SIZES}
                priority={sectionIndex === 0 && index < 2}
                onOpen={() =>
                  morphTo(
                    document.querySelector<HTMLElement>(`[data-producto="${product.slug}"] img`),
                    () => setSelected(product),
                  )
                }
                action={
                  <IconButton
                    tone="aji"
                    label={
                      needsQuickView(product)
                        ? `Elegir opciones de ${product.name}`
                        : `Agregar ${product.name}`
                    }
                    icon={null}
                    className="icono-mas"
                    disabled={!product.isAvailable}
                    onClick={(event) => quickAdd(product, event.currentTarget)}
                  />
                }
              />
            ))}
          </ul>
        </section>
      ))}

      <QuickView product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
