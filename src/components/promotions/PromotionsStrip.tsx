import Image from "next/image";

import { promoBadge, promoSummary } from "@/features/promotions/pricing";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

/**
 * Franja «Promociones» arriba de cada carta: las vigentes de todas las cartas, en una fila que
 * se desliza. Tocar una abre la vista rápida del plato ahí mismo.
 * Marcado mínimo a propósito: la carta Marina debe quedar bajo 1 000 nodos (M-03).
 */
export function PromotionsStrip({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (product: Product) => void;
}) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="titulo-promociones" className="mt-6">
      <h2 id="titulo-promociones" className="text-2xl font-semibold">
        Promociones
      </h2>
      <ul className="-mx-4 mt-3 flex snap-x [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2">
        {products.map((product) => {
          const promo = product.promotion;
          if (!promo) return null;
          const summary = promoSummary(product);
          const from = summary.isFrom ? "desde " : "";
          const image = product.image?.url ?? promo.imageUrl;
          return (
            <li
              key={product.id}
              className="border-borde bg-superficie elevar relative w-64 shrink-0 snap-start overflow-hidden rounded-md border pb-3 shadow-sm"
            >
              {/* La etiqueta (−20 %, 2×1…) se dibuja con CSS sobre la foto: un nodo menos. */}
              <div
                data-etiqueta={promoBadge(promo, formatPrice)}
                className="bg-crema-200 before:bg-rocoto relative aspect-[16/9] before:absolute before:top-2 before:left-2 before:z-10 before:rounded-sm before:px-2 before:py-0.5 before:text-sm before:font-semibold before:text-white before:content-[attr(data-etiqueta)]"
              >
                {image ? (
                  <Image src={image} alt="" fill sizes="256px" className="object-cover" />
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onOpen(product)}
                aria-label={`${promo.title}: ${promoBadge(promo, formatPrice)}`}
                className="mt-2 block px-3 text-left text-base leading-snug font-semibold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline-3 focus-visible:after:outline-[var(--color-foco)]"
              >
                {promo.title}
              </button>
              <p className="text-tinta-suave px-3 text-sm">{product.name}</p>
              {/* Mismo formato que la ventana emergente: antes → ahora · para cuántos platos.
                  El detalle va en la misma línea de texto (salto con pre-line): sin nodos extra (M-03). */}
              <p className="text-rocoto-texto px-3 text-sm font-semibold whitespace-pre-line tabular-nums">
                <s className="text-tinta-suave font-medium">
                  {from}
                  {formatPrice(summary.beforeCents)}
                </s>
                {` ahora ${from}${formatPrice(summary.nowCents)}
${summary.detail}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
