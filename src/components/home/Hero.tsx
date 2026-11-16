import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

import { HeroModeChips } from "./HeroModeChips";
import { HeroVideo } from "./HeroVideo";

function FeaturedDish({ product }: { product: Product }) {
  return (
    <Link
      href={`/carta/marina#${product.slug}`}
      className="group border-borde bg-superficie hover:border-marino-600 flex w-full max-w-xs items-center gap-3 rounded-md border p-2 pr-4 shadow-lg transition-colors"
    >
      {product.image ? (
        <span className="relative size-16 shrink-0 overflow-hidden rounded-sm">
          <Image src={product.image.url} alt="" fill sizes="64px" className="object-cover" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="text-rocoto-texto block text-xs font-semibold tracking-wide uppercase">
          El favorito
        </span>
        <span className="block truncate font-semibold">{product.name}</span>
        <span className="text-tinta-suave block text-sm tabular-nums">
          {formatPrice(product.priceCents)} ·{" "}
          <span className="group-hover:underline">Ver en la carta</span>
        </span>
      </span>
    </Link>
  );
}

/** F1-06 · Portada: titular, acciones y video de presentación en una ventana 16:9. */
export function Hero({ featured }: { featured: Product | null }) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:pt-14 lg:pb-20"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="parallax-texto">
          <p
            className="entra text-rocoto-texto text-sm font-semibold tracking-wide uppercase"
            style={{ "--i": 0 } as CSSProperties}
          >
            Lince · Jesús María · desde 2010
          </p>
          <h1
            id="hero-titulo"
            className="entra mt-3 text-4xl font-semibold"
            style={{ "--i": 1 } as CSSProperties}
          >
            Sabor marino con 14 años de cariño
          </h1>
          <p
            className="entra text-tinta-suave mt-4 max-w-lg text-lg"
            style={{ "--i": 2 } as CSSProperties}
          >
            ¿Qué se te antoja hoy? Pide delivery, recoge en tu sede o reserva tu mesa.
          </p>
          <div className="entra mt-7 flex flex-wrap gap-3" style={{ "--i": 3 } as CSSProperties}>
            <Button href="/carta/marina" size="lg">
              Pedir ahora
            </Button>
            <Button href="/reservas" variant="secundario" size="lg">
              Reservar mesa
            </Button>
          </div>
          <HeroModeChips />
        </div>

        <div className="parallax-media relative">
          <HeroVideo />
          {featured ? (
            <div className="-mt-8 flex justify-center lg:absolute lg:-bottom-8 lg:-left-6 lg:mt-0 lg:justify-start">
              <FeaturedDish product={featured} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
