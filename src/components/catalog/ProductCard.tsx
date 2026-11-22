import { Flame, Leaf, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { cardPrices, promoBadge } from "@/features/promotions/pricing";
import { formatPrice, formatPriceFrom } from "@/lib/format";
import type { Product, ProductTag } from "@/types/catalog";

const TAG_BADGES: Partial<
  Record<
    ProductTag,
    { label: string; icon: ReactNode; tone: "picante" | "vegetariano" | "favorito" | "neutro" }
  >
> = {
  picante: {
    label: "Picante",
    icon: <Flame aria-hidden="true" className="size-3.5" />,
    tone: "picante",
  },
  vegetariano: {
    label: "Vegetariano",
    icon: <Leaf aria-hidden="true" className="size-3.5" />,
    tone: "vegetariano",
  },
  favorito: {
    label: "Favorito",
    icon: <Star aria-hidden="true" className="size-3.5" />,
    tone: "favorito",
  },
  compartir: {
    label: "Para compartir",
    icon: <Users aria-hidden="true" className="size-3.5" />,
    tone: "neutro",
  },
  ninos: { label: "Para niños", icon: null, tone: "neutro" },
};

/** El nombre se "estira" sobre toda la tarjeta: se toca en cualquier parte. */
const STRETCHED =
  "text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline-3 focus-visible:after:outline-[var(--color-foco)]";

type ProductCardProps = {
  product: Product;
  /** Tamaños de la foto según la cuadrícula donde se usa (next/image `sizes`). */
  sizes: string;
  /** Acción principal (botón “+”, enlace…). La tarjeta no decide qué hace. */
  action?: ReactNode;
  priority?: boolean;
  /** Si se pasa, toda la tarjeta abre la vista rápida (el nombre es el botón). */
  onOpen?: () => void;
  /** Si se pasa, toda la tarjeta es un enlace (el nombre es el enlace). */
  href?: string;
  className?: string;
  /**
   * Elemento raíz. En una cuadrícula <ul> se usa "li" para que la tarjeta sea el propio elemento
   * de la lista (QA-006: un nodo menos por plato en cartas de 50+ platos).
   */
  as?: "article" | "li";
  /** Revelado al hacer scroll (motion.css) y orden de la cascada (--i). */
  reveal?: boolean;
  style?: CSSProperties;
};

/** Tarjeta de plato (F1-09): foto 4:3, nombre, descripción en 2 líneas, precio y etiquetas. */
export function ProductCard({
  product,
  sizes,
  action,
  priority = false,
  onOpen,
  href,
  className,
  as: Root = "article",
  reveal = false,
  style,
}: ProductCardProps) {
  const price = formatPriceFrom(
    product.priceCents,
    product.variants.map((v) => v.priceCents),
  );
  const badges = product.tags.flatMap((tag) => TAG_BADGES[tag] ?? []);
  const promo = product.promotion ?? null;
  const promoPrices = promo ? cardPrices(product) : null;
  const isDiscounted = promoPrices !== null && promoPrices.promoCents < promoPrices.regularCents;

  return (
    <Root
      id={product.slug}
      data-producto={product.slug}
      data-reveal={reveal || undefined}
      style={style}
      className={cx(
        "group elevar border-borde bg-superficie relative flex h-full flex-col overflow-hidden rounded-md border shadow-sm",
        !product.isAvailable && "opacity-70",
        className,
      )}
    >
      <div className="bg-crema-200 relative aspect-[4/3] overflow-hidden">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={sizes}
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="text-tinta-suave grid h-full place-items-center text-sm">
            Foto próximamente
          </div>
        )}
        {!product.isAvailable || promo ? (
          // Solo si hay algo que mostrar: un nodo menos en cada tarjeta (M-03, < 1000 nodos).
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {!product.isAvailable ? <Badge tone="agotado">Agotado</Badge> : null}
            {promo && product.isAvailable ? (
              <Badge tone="promo" className="text-sm shadow-sm">
                {promoBadge(promo, formatPrice)}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="font-sans text-base leading-snug font-semibold sm:text-lg">
          {onOpen ? (
            <button type="button" onClick={onOpen} className={STRETCHED}>
              {product.name}
            </button>
          ) : href ? (
            <Link href={href} prefetch={false} className={STRETCHED}>
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        {product.description ? (
          <p className="text-tinta-suave line-clamp-2 text-sm">{product.description}</p>
        ) : null}
        {badges.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label="Características">
            {badges.map((badge) => (
              <li key={badge.label}>
                <Badge tone={badge.tone} icon={badge.icon}>
                  {badge.label}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 [&>*:last-child]:relative [&>*:last-child]:z-10">
          {isDiscounted && promoPrices ? (
            // Marcado mínimo (M-03): el precio normal tachado arriba y el de ahora debajo.
            <p className="text-rocoto-texto font-semibold whitespace-nowrap tabular-nums">
              <s className="text-tinta-suave block text-xs font-medium">
                {promoPrices.isFrom ? "Desde " : ""}
                {formatPrice(promoPrices.regularCents)}
              </s>
              {formatPrice(promoPrices.promoCents)}
            </p>
          ) : (
            <p className="font-semibold whitespace-nowrap tabular-nums">
              {price.startsWith("Desde ") ? (
                <>
                  <span className="text-tinta-suave block text-xs font-medium">Desde</span>
                  {price.slice("Desde ".length)}
                </>
              ) : (
                price
              )}
            </p>
          )}
          {action}
        </div>
      </div>
    </Root>
  );
}
