import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/Button";
import { FOUNDED_YEAR, yearsOpen } from "@/config/site";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

import { HeroModeChips } from "./HeroModeChips";
import { HeroVideo } from "./HeroVideo";

function FeaturedDish({ product }: { product: Product }) {
  return (
    <Link
      href={`/carta/marina#${product.slug}`}
      className="group border-borde bg-superficie text-tinta hover:border-marino-600 flex w-full max-w-xs items-center gap-3 rounded-md border p-2 pr-4 shadow-lg transition-colors"
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

/**
 * F1-06 · Portada a pantalla completa: el video ocupa todo el fondo (como una ventana al local)
 * con una capa marino para que el texto crema se lea. En celular la capa es más fuerte abajo,
 * donde va el texto; en escritorio, a la izquierda. El alto usa svh: no salta cuando el navegador
 * del celular muestra u oculta su barra.
 */
export function Hero({ featured }: { featured: Product | null }) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="sobre-marino bg-marino-800 text-crema relative isolate overflow-clip"
    >
      <div className="parallax-media absolute inset-x-0 -inset-y-10 -z-10">
        <HeroVideo
          variant="fondo"
          overlayClassName="bg-gradient-to-t from-marino via-marino/75 to-marino/25 lg:bg-gradient-to-r lg:from-marino/95 lg:via-marino/70 lg:to-marino/10"
        />
      </div>

      {/* pointer-events-none: deja pasar el mouse al video (botón de pausa) salvo en el contenido. */}
      <div className="pointer-events-none relative mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-end px-4 pt-28 pb-10 sm:min-h-[64svh] lg:min-h-[78svh] lg:justify-center lg:pt-16 lg:pb-16">
        <div className="parallax-texto pointer-events-auto max-w-xl">
          <p
            className="entra text-aji text-sm font-semibold tracking-[0.18em] uppercase"
            style={{ "--i": 0 } as CSSProperties}
          >
            Lince · Jesús María · desde {FOUNDED_YEAR}
          </p>
          <h1
            id="hero-titulo"
            className="entra text-crema mt-3 text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            Sabor marino con {yearsOpen()} años{" "}
            <span className="acento-mano text-aji">de cariño</span>
          </h1>
          <p
            className="entra text-crema/85 mt-4 max-w-lg text-lg"
            style={{ "--i": 2 } as CSSProperties}
          >
            ¿Qué se te antoja hoy? Pide delivery, recoge en tu sede o reserva tu mesa.
          </p>
          <div className="entra mt-7 flex flex-wrap gap-3" style={{ "--i": 3 } as CSSProperties}>
            <Button href="/carta/marina" size="lg">
              Pedir ahora
            </Button>
            <Button href="/reservas" variant="claro" size="lg">
              Reservar mesa
            </Button>
          </div>
          <HeroModeChips tone="claro" />
        </div>

        {featured ? (
          <div className="pointer-events-auto mt-8 lg:absolute lg:right-4 lg:bottom-10 lg:mt-0">
            <FeaturedDish product={featured} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
