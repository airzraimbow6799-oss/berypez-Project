import { ArrowUpRight, Quote } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { CountUp } from "@/components/home/CountUp";
import { FOUNDED_YEAR, yearsOpen } from "@/config/site";
import { featuredReports, PRESS_QUOTES, RECOGNITIONS } from "@/config/nosotros";

import { ReportCarousel } from "./ReportCarousel";

/** Portada de «Nosotros»: quién es Berla, con su foto y los años contados. */
export function AboutHero() {
  return (
    <section aria-labelledby="nosotros-titulo" className="bg-marino text-crema">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.15fr_1fr] md:py-16">
        <div>
          <p className="entra text-aji text-sm font-semibold tracking-wide uppercase">
            Nosotros · desde {FOUNDED_YEAR}
          </p>
          <h1
            id="nosotros-titulo"
            className="entra text-crema mt-3 text-4xl leading-tight font-semibold md:text-5xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            Una cocina que nace del deseo de servir
          </h1>
          <p
            className="entra text-crema/85 mt-5 max-w-xl text-lg"
            style={{ "--i": 2 } as CSSProperties}
          >
            Berla Carlos creció en Piscocoto viendo cocinar a su madre. El 19 de setiembre de{" "}
            {FOUNDED_YEAR} abrió Berypez junto a Julio, su compañero de vida, con un deseo simple:
            servir y brindar alegría a las personas.
          </p>
          <p className="entra mt-8 flex items-baseline gap-3" style={{ "--i": 3 } as CSSProperties}>
            <span className="font-display text-aji text-7xl leading-none font-semibold">
              <CountUp to={yearsOpen()} />
            </span>
            <span className="text-crema/85 max-w-40 text-sm leading-snug">
              años sirviendo en Jesús María y Lince
            </span>
          </p>
        </div>
        <figure className="entra mx-auto w-full max-w-sm" style={{ "--i": 2 } as CSSProperties}>
          <div className="bg-crema rotate-2 rounded-md p-3 pb-4 shadow-2xl">
            <div className="relative aspect-[97/100] overflow-hidden rounded-sm">
              <Image
                src="/nosotros/berla.webp"
                alt="Berla Carlos con su chaqueta de chef en el stand de Berypez, sosteniendo el afiche del Día Nacional del Cebiche 2023."
                fill
                priority
                sizes="(min-width: 768px) 384px, 90vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-tinta-suave mt-3 text-center text-sm">
              Berla Carlos, fundadora y chef · Día Nacional del Cebiche 2023
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}

/** El relato de la casa (texto de berypez.pe) y la voz de Bery (Infotur, 2019). */
export function AboutStory() {
  return (
    <section aria-labelledby="historia-bery" className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-14">
        <div data-reveal="izq">
          <h2 id="historia-bery" className="titulo-ola text-3xl font-semibold">
            De Piscocoto a tu mesa
          </h2>
          <div className="text-tinta-suave mt-5 space-y-4 text-lg">
            <p>
              En Piscocoto, las tareas en familia eran una fiesta: cosechar, lavar y pelar los
              insumos, mirar cocinar a su madre. Ahí aprendió que servir es una felicidad, y que se
              sirve con amor.
            </p>
            <p>
              Muy joven viajó a México, donde encontró una cultura con tradiciones parecidas a las
              nuestras, sobre todo en esa forma de dar amor en la mesa. Volvió al Perú sabiendo que
              su camino era la cocina y ver a su público feliz.
            </p>
            <p>
              Hoy Berypez tiene seis cartas, de la marina a la criolla, y una cocina con acento
              norteño: cebiche con tortita de choclo, chinguirito, Berychaufa.
            </p>
          </div>
        </div>
        <blockquote
          data-reveal="der"
          style={{ "--i": 1 } as CSSProperties}
          className="bg-crema-200 relative self-start rounded-md p-7"
        >
          <Quote aria-hidden="true" className="text-aji absolute -top-4 left-6 size-9" />
          <p className="font-display text-marino text-2xl leading-snug">
            El equipo de Berypez es una familia, varios de ellos estudian y yo feliz de que ellos
            salgan adelante.
          </p>
          <footer className="text-tinta-suave mt-4 text-sm">
            Berla Carlos, en{" "}
            <a
              href={PRESS_QUOTES[0]?.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Infotur Perú
            </a>{" "}
            (2019)
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

const OUTLETS = [
  "RPP Noticias",
  "Panamericana TV",
  "Nativa",
  "Trome",
  "Andina",
  "Infotur Perú",
  "Visión Gourmet",
];

/** «Nos vieron en»: medios (nombres, no logos) y los videos, que cargan al tocarlos. */
export function AboutPress() {
  return (
    <section aria-labelledby="prensa" className="mx-auto max-w-6xl px-4 py-14">
      <h2 id="prensa" data-reveal className="titulo-ola text-3xl font-semibold">
        Nos vieron en
      </h2>
      <ul
        data-reveal
        aria-label="Medios que hablaron de Berypez"
        className="border-borde mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y py-5"
      >
        {OUTLETS.map((outlet) => (
          <li
            key={outlet}
            className="font-display text-marino/70 text-xl font-semibold tracking-tight"
          >
            {outlet}
          </li>
        ))}
      </ul>
      <div data-reveal className="mt-10">
        <h3 className="text-xl font-semibold">Lo mejor de Berypez en TV</h3>
        <div className="mt-4">
          <ReportCarousel videos={featuredReports()} />
        </div>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {PRESS_QUOTES.map((q, index) => (
          <li
            key={q.href}
            data-reveal
            style={{ "--i": index } as CSSProperties}
            className="border-borde bg-superficie flex flex-col rounded-md border p-5 shadow-sm"
          >
            <p className="text-tinta flex-1">«{q.quote}»</p>
            <a
              href={q.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-marino-600 mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              {q.outlet} · {q.date}
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="sr-only"> (abre la nota en otra pestaña)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Reconocimientos y alianzas, con enlace a la fuente pública de cada uno. */
export function AboutRecognitions() {
  return (
    <section aria-labelledby="reconocimientos" className="bg-marino text-crema">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2
          id="reconocimientos"
          data-reveal
          className="titulo-ola text-crema text-3xl font-semibold"
        >
          Reconocimientos y alianzas
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECOGNITIONS.map((r, index) => (
            <li
              key={r.title}
              data-reveal
              style={{ "--i": index % 4 } as CSSProperties}
              className="border-crema/15 bg-marino-800 rounded-md border p-5"
            >
              <h3 className="text-aji text-xl font-semibold">{r.title}</h3>
              <p className="text-crema/85 mt-2 text-sm">{r.detail}</p>
              {r.href ? (
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-crema mt-3 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Ver fuente
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                  <span className="sr-only"> de {r.title} (abre en otra pestaña)</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
