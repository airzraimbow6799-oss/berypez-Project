"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { trackPromotion } from "@/features/analytics/promotions";
import { promoHref } from "@/features/promotions/links";
import { cardPrices, promoBadge } from "@/features/promotions/pricing";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

/** Cada cuánto pasa a la siguiente promoción. */
export const SLIDE_MS = 6000;
const SWIPE_PX = 40;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Carrusel de promociones dentro de la ventana emergente. Pasa solo cada 6 s (salvo con
 * «reducir movimiento»), se detiene al tocarlo o pasar el mouse, tiene botón de pausa (WCAG
 * 2.2.2) y se desliza con el dedo. «Ver promo» lleva a la carta y abre el plato.
 */
export function PromoCarousel({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => products.length > 1 && !prefersReducedMotion());
  const [isHeld, setIsHeld] = useState(false);
  const seen = useRef(new Set<number>());
  const swipeStart = useRef<number | null>(null);
  const count = products.length;
  const product = products[index] ?? products[0];

  // Cuenta cada promoción vista una sola vez (GA4 «view_promotion»).
  useEffect(() => {
    if (!product || seen.current.has(product.id)) return;
    seen.current.add(product.id);
    trackPromotion("view_promotion", product);
  }, [product]);

  useEffect(() => {
    if (!isPlaying || isHeld || count < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, isHeld, count, index]);

  if (!product?.promotion) return null;
  const promo = product.promotion;
  const prices = cardPrices(product);
  const image = promo.imageUrl ?? product.image?.url ?? null;
  const go = (next: number) => setIndex(((next % count) + count) % count);

  return (
    <Dialog
      open
      onClose={onClose}
      variant="modal"
      title={count > 1 ? "Promociones de hoy" : "Promoción de hoy"}
    >
      <section
        aria-roledescription="carrusel"
        aria-label="Promociones"
        onPointerEnter={() => setIsHeld(true)}
        onPointerLeave={() => setIsHeld(false)}
        onFocus={() => setIsHeld(true)}
        onBlur={() => setIsHeld(false)}
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (start === null || count < 2) return;
          const dx = e.clientX - start;
          if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
        }}
        className="-mx-5 -mt-4 flex flex-col"
      >
        <div
          key={product.id}
          role="group"
          aria-roledescription="diapositiva"
          aria-label={`${index + 1} de ${count}: ${promo.title}`}
          className="animate-[marea-sube_300ms_ease-out] motion-reduce:animate-none"
        >
          <Link
            href={promoHref(product)}
            prefetch={false}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => trackPromotion("select_promotion", product)}
            className="bg-crema-200 relative block aspect-[4/3] overflow-hidden"
          >
            {image ? (
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 640px) 512px, 100vw"
                priority
                className="object-cover"
              />
            ) : null}
            <span className="bg-rocoto font-display absolute top-3 left-3 rounded-md px-3 py-1 text-2xl font-semibold text-white shadow-md">
              {promoBadge(promo, formatPrice)}
            </span>
          </Link>
          <div className="flex flex-col gap-1 px-5 pt-4">
            <p className="font-display text-2xl leading-tight font-semibold">{promo.title}</p>
            <p className="text-tinta-suave">{product.name}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {prices.promoCents < prices.regularCents ? (
                <>
                  <span className="sr-only">Precio normal: </span>
                  <s className="text-tinta-suave text-base font-medium">
                    {formatPrice(prices.regularCents)}
                  </s>{" "}
                  <span className="text-rocoto-texto">
                    <span className="sr-only">Ahora: </span>
                    {prices.isFrom ? "desde " : ""}
                    {formatPrice(prices.promoCents)}
                  </span>
                </>
              ) : (
                <span className="text-rocoto-texto">Lleva 2 y paga 1</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          {count > 1 ? (
            <div className="flex items-center gap-1">
              <IconButton
                label="Promoción anterior"
                icon={<ChevronLeft aria-hidden="true" className="size-5" />}
                onClick={() => go(index - 1)}
              />
              <ul className="flex items-center gap-1" aria-label="Elegir promoción">
                {products.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-label={`Ver promoción ${i + 1}: ${p.promotion?.title ?? p.name}`}
                      aria-current={i === index ? "true" : undefined}
                      onClick={() => go(i)}
                      className="grid size-8 place-items-center"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-2 rounded-full transition-all ${i === index ? "bg-marino w-5" : "bg-tinta-suave/40 w-2"}`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <IconButton
                label="Promoción siguiente"
                icon={<ChevronRight aria-hidden="true" className="size-5" />}
                onClick={() => go(index + 1)}
              />
              <IconButton
                label={isPlaying ? "Pausar el carrusel" : "Reanudar el carrusel"}
                icon={
                  isPlaying ? (
                    <Pause aria-hidden="true" className="size-5" />
                  ) : (
                    <Play aria-hidden="true" className="size-5" />
                  )
                }
                onClick={() => setIsPlaying((v) => !v)}
              />
            </div>
          ) : (
            <span />
          )}
          <Link
            href={promoHref(product)}
            prefetch={false}
            onClick={() => trackPromotion("select_promotion", product)}
            className="bg-aji text-marino hover:bg-aji-600 min-h-tactil rounded-pill inline-flex items-center px-6 font-semibold"
          >
            Ver promo
          </Link>
        </div>
      </section>
    </Dialog>
  );
}
