import { Flame, Leaf, Star, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { formatPriceFrom } from "@/lib/format";
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

type ProductCardProps = {
  product: Product;
  /** Tamaños de la foto según la cuadrícula donde se usa (next/image `sizes`). */
  sizes: string;
  /** Acción principal (botón “+”, enlace…). La tarjeta no decide qué hace. */
  action?: ReactNode;
  priority?: boolean;
  className?: string;
};

/** Tarjeta de plato (F1-09): foto 4:3, nombre, descripción en 2 líneas, precio y etiquetas. */
export function ProductCard({
  product,
  sizes,
  action,
  priority = false,
  className,
}: ProductCardProps) {
  const price = formatPriceFrom(
    product.priceCents,
    product.variants.map((v) => v.priceCents),
  );
  const badges = product.tags.flatMap((tag) => TAG_BADGES[tag] ?? []);

  return (
    <article
      id={product.slug}
      className={cx(
        "group border-borde bg-superficie relative flex h-full flex-col overflow-hidden rounded-md border shadow-sm transition-shadow duration-200 hover:shadow-md",
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
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="text-tinta-suave grid h-full place-items-center text-sm">
            Foto próximamente
          </div>
        )}
        {!product.isAvailable ? (
          <Badge tone="agotado" className="absolute top-2 left-2">
            Agotado
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="font-sans text-base leading-snug font-semibold sm:text-lg">
          {product.name}
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
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="font-semibold tabular-nums">{price}</p>
          {action}
        </div>
      </div>
    </article>
  );
}
