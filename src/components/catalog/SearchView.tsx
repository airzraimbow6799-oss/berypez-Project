"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { matchesQuery, scoreProduct } from "@/features/catalog/search";
import type { Product } from "@/types/catalog";

import { ProductCard } from "./ProductCard";

const SUGGESTIONS = ["ceviche", "lomo saltado", "chicharrón", "causa", "pisco sour", "chicha"];

/** Resultados al instante con foto y precio, ordenados por relevancia. */
export function SearchView({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const results = useMemo(
    () =>
      deferred.trim()
        ? products
            .filter((p) => matchesQuery(p, deferred))
            .sort((a, b) => scoreProduct(b, deferred) - scoreProduct(a, deferred))
            .slice(0, 24)
        : [],
    [products, deferred],
  );

  return (
    <div className="mt-6">
      <div className="relative max-w-xl">
        <label htmlFor="buscar" className="sr-only">
          Buscar un plato
        </label>
        <Search
          aria-hidden="true"
          className="text-tinta-suave pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
        />
        <input
          id="buscar"
          type="search"
          autoFocus
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué se te antoja? Ej.: seviche, lomo, chicha…"
          className="border-borde bg-superficie focus-visible:border-marino-600 rounded-pill min-h-14 w-full border pr-4 pl-12 text-lg"
        />
      </div>

      {!query.trim() ? (
        <div className="mt-6">
          <p className="text-tinta-suave">Lo más buscado:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setQuery(s)}
                  className="border-borde bg-superficie hover:border-marino-600 rounded-pill min-h-tactil border px-4 font-semibold"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-tinta-suave mt-4 text-sm">
            {results.length === 0
              ? "No encontramos platos con esa búsqueda. Prueba con otra palabra."
              : `${results.length} ${results.length === 1 ? "plato" : "platos"}`}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {results.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                  action={
                    <Link
                      href={`/carta/${product.menus[0] ?? "marina"}#${product.slug}`}
                      className="text-marino-600 min-h-tactil inline-flex items-center text-sm font-semibold hover:underline"
                      aria-label={`Pedir ${product.name}`}
                    >
                      Pedir
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
