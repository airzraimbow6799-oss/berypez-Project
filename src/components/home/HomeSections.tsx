import { ArrowRight, CalendarDays, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { BranchMap } from "@/components/home/BranchMap";
import { FloatingIngredients } from "@/components/brand/FloatingIngredients";
import { CountUp } from "@/components/home/CountUp";
import { Button } from "@/components/ui/Button";
import {
  BRANCHES,
  FOUNDED_YEAR,
  isGoogleMapsEmbed,
  MENU_LINKS,
  PAYMENT_METHODS,
  yearsOpen,
} from "@/config/site";
import type { Menu, Product } from "@/types/catalog";

function SectionHeading({
  id,
  title,
  intro,
  link,
}: {
  id: string;
  title: string;
  intro?: string;
  link?: ReactNode;
}) {
  return (
    <div data-reveal className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="titulo-ola text-3xl font-semibold">
          {title}
        </h2>
        {intro ? <p className="text-tinta-suave mt-2 max-w-xl">{intro}</p> : null}
      </div>
      {link}
    </div>
  );
}

const GRID_SIZES = "(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw";

/** F1-07 · Accesos a las 6 cartas con foto. */
export function MenuAccess({ menus, covers }: { menus: Menu[]; covers: Map<string, Product> }) {
  return (
    <section
      aria-labelledby="cartas"
      className="diferida relative isolate mx-auto max-w-6xl px-4 py-12"
    >
      <FloatingIngredients
        items={[
          { tipo: "limon", className: "top-4 right-2 size-16 rotate-12 md:size-20" },
          {
            tipo: "aji",
            color: "aji",
            velocidad: "rapida",
            className: "top-20 right-28 hidden size-12 -rotate-12 md:block",
          },
          { tipo: "concha", className: "bottom-2 left-1/3 hidden size-14 md:block" },
        ]}
      />
      <SectionHeading
        id="cartas"
        title="Nuestras cartas"
        intro="Seis cartas, una sola cocina de barrio."
      />
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {menus.map((menu, index) => {
          const cover = covers.get(menu.slug);
          return (
            <li
              key={menu.slug}
              data-reveal={index % 2 === 0 ? "izq" : "der"}
              style={{ "--i": index % 3 } as CSSProperties}
            >
              <Link
                href={`/carta/${menu.slug}`}
                prefetch={false}
                data-clip
                className="group elevar relative block aspect-[4/3] overflow-hidden rounded-md shadow-sm"
              >
                {cover?.image ? (
                  <Image
                    src={cover.image.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 370px, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <span className="bg-crema-200 absolute inset-0" />
                )}
                <span className="from-marino/85 via-marino/30 absolute inset-0 bg-gradient-to-t to-transparent" />
                <span className="text-crema absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 sm:p-4">
                  <span className="font-display min-w-0 text-base leading-tight font-semibold hyphens-auto sm:text-xl">
                    {menu.name}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Fila de platos con enlace a la carta (recomendados, dúos y tríos). */
export function ProductShelf({
  id,
  title,
  intro,
  products,
  menuSlug,
}: {
  id: string;
  title: string;
  intro: string;
  products: Product[];
  menuSlug: string;
}) {
  if (products.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={id} className="diferida mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        id={id}
        title={title}
        intro={intro}
        link={
          <Link
            href={`/carta/${menuSlug}`}
            prefetch={false}
            className="text-marino-600 min-h-tactil inline-flex items-center gap-1 font-semibold hover:underline"
          >
            Ver la carta <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      />
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {products.map((product, index) => (
          <li key={product.id} data-reveal style={{ "--i": index % 4 } as CSSProperties}>
            <ProductCard
              product={product}
              sizes={GRID_SIZES}
              href={`/carta/${product.menus[0] ?? menuSlug}#${product.slug}`}
              action={
                <span
                  aria-hidden="true"
                  className="bg-aji text-marino group-hover:bg-aji-600 pointer-events-none flex size-11 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <ArrowRight className="size-5" />
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Historia en tres líneas (propuesta §8) y los números de la casa, todos calculados. */
export function Story() {
  const years = yearsOpen();
  const facts = [
    { value: String(BRANCHES.length), label: `sedes: ${BRANCHES.map((b) => b.name).join(" y ")}` },
    { value: String(MENU_LINKS.length), label: "cartas, una sola cocina" },
    {
      value: String(PAYMENT_METHODS.length),
      // Yape y Plin son marcas: van con mayúscula; el resto en minúscula dentro de la frase.
      label: `formas de pago: ${PAYMENT_METHODS.map((m) =>
        /^(Yape|Plin)$/.test(m) ? m : m.toLowerCase(),
      )
        .join(", ")
        .replace(/, ([^,]+)$/, " y $1")}`,
    },
  ];
  return (
    <section aria-labelledby="historia" className="diferida bg-crema-200 relative isolate">
      <FloatingIngredients
        items={[
          { tipo: "pez", className: "top-8 right-6 size-20 -rotate-6 md:size-24" },
          {
            tipo: "limon",
            color: "aji",
            velocidad: "rapida",
            className: "bottom-6 right-1/4 hidden size-12 md:block",
          },
        ]}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <p
          data-reveal="izq"
          className="font-display text-marino text-7xl leading-none font-semibold md:text-8xl"
          aria-hidden="true"
        >
          <CountUp to={years} />
        </p>
        <div data-reveal="der" style={{ "--i": 1 } as CSSProperties}>
          <h2 id="historia" className="titulo-ola text-3xl font-semibold">
            Una cevichería de barrio, desde {FOUNDED_YEAR}
          </h2>
          <p className="text-tinta-suave mt-3 max-w-2xl text-lg">
            Berla y Julio abrieron Berypez con una idea simple: pescado fresco, sazón de casa y
            trato de familia. {years} años después seguimos igual, ahora en Lince y en Jesús María.
          </p>
        </div>
        <dl
          data-reveal
          style={{ "--i": 2 } as CSSProperties}
          className="border-marino/15 grid gap-4 border-t pt-6 sm:grid-cols-3 md:col-span-2"
        >
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-3 sm:block">
              <dt className="sr-only">{fact.label}</dt>
              <dd className="font-display text-marino text-4xl leading-none font-semibold">
                {fact.value}
              </dd>
              <dd className="text-tinta-suave sm:mt-2" aria-hidden="true">
                {fact.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Sedes con acciones. Dirección, horario y mapa aparecen cuando la dueña los confirme. */
export function Branches() {
  return (
    <section aria-labelledby="sedes" className="diferida mx-auto max-w-6xl px-4 py-12">
      <SectionHeading id="sedes" title="Nuestras sedes" />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {BRANCHES.map((branch, index) => (
          <li
            key={branch.slug}
            data-reveal={index % 2 === 0 ? "izq" : "der"}
            style={{ "--i": index } as CSSProperties}
            className="border-borde bg-superficie overflow-hidden rounded-md border p-5 shadow-sm"
          >
            {branch.photo ? (
              <div className="relative -mx-5 -mt-5 mb-5 aspect-[4/3]">
                <Image
                  src={branch.photo.src}
                  alt={branch.photo.alt}
                  fill
                  sizes="(min-width: 1152px) 560px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: branch.photo.position }}
                />
              </div>
            ) : null}
            <h3 className="flex items-center gap-2 text-2xl font-semibold">
              <MapPin aria-hidden="true" className="text-rocoto-texto size-6" />
              {branch.name}
            </h3>
            {branch.address ? <p className="text-tinta-suave mt-2">{branch.address}</p> : null}
            {branch.hours ? <p className="text-tinta-suave">{branch.hours}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/carta/marina">Pedir aquí</Button>
              <Button href={`/reservas?sede=${branch.slug}`} variant="secundario">
                <CalendarDays aria-hidden="true" className="size-5" />
                Reservar aquí
              </Button>
              {branch.mapsUrl ? (
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-marino-600 rounded-pill min-h-tactil inline-flex items-center gap-1 px-4 font-semibold hover:underline"
                >
                  <Navigation aria-hidden="true" className="size-5" />
                  Cómo llegar
                  <span className="sr-only"> (abre Google Maps)</span>
                </a>
              ) : null}
            </div>
            {isGoogleMapsEmbed(branch.mapsEmbedUrl) ? (
              <div className="mt-4">
                <BranchMap branchName={branch.name} embedUrl={branch.mapsEmbedUrl} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
