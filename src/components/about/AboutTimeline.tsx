import { ArrowUpRight, Tv } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { FloatingIngredients } from "@/components/brand/FloatingIngredients";
import { formatMonthYear, type TimelineImage, timelineByYear } from "@/config/nosotros";

import { PressVideo } from "./PressVideo";

/** Fotos del año que flotan a distinta velocidad al hacer scroll (parallax, solo CSS). */
function YearCollage({ images }: { images: readonly TimelineImage[] }) {
  const [first, second] = images;
  if (!first) {
    return null;
  }
  return (
    <div className="relative flex gap-3 lg:block lg:pt-6">
      <div
        data-flota="lenta"
        className="bg-crema relative aspect-[4/3] w-[calc(50%-0.375rem)] -rotate-2 overflow-hidden rounded-md p-1.5 shadow-lg lg:w-full"
      >
        <div className="relative size-full overflow-hidden rounded-sm">
          <Image
            src={first.src}
            alt={first.alt}
            fill
            sizes="(min-width: 1024px) 320px, 45vw"
            className="object-cover"
          />
        </div>
      </div>
      {second ? (
        <div
          data-flota="rapida"
          className="bg-crema relative mt-8 aspect-[4/3] w-[calc(50%-0.375rem)] rotate-3 overflow-hidden rounded-md p-1.5 shadow-xl lg:-mt-10 lg:ml-16 lg:w-4/5"
        >
          <div className="relative size-full overflow-hidden rounded-sm">
            <Image
              src={second.src}
              alt={second.alt}
              fill
              sizes="(min-width: 1024px) 260px, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Historia año por año: el año queda fijo mientras se lee, las fotos flotan con el scroll y
 * cada año muestra también sus reportajes de TV (que cargan al tocarlos).
 */
export function AboutTimeline() {
  const years = timelineByYear();
  return (
    // overflow-x-clip (no hidden): recorta las fotos inclinadas sin romper el año «sticky».
    <section aria-labelledby="hitos" className="bg-crema-200 relative isolate overflow-x-clip">
      <FloatingIngredients
        items={[
          { tipo: "concha", className: "top-10 right-6 size-16 rotate-12 md:size-20" },
          {
            tipo: "aji",
            color: "aji",
            velocidad: "rapida",
            className: "top-1/3 right-2 hidden size-12 md:block",
          },
          { tipo: "pez", className: "top-2/3 right-10 hidden size-20 -rotate-12 lg:block" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 id="hitos" data-reveal className="titulo-ola text-3xl font-semibold">
          Nuestra historia, año por año
        </h2>
        <p data-reveal className="text-tinta-suave mt-3 max-w-2xl text-lg">
          De los primeros menús a recibir chefs de todo el continente: lo que logramos cada año y
          dónde nos vieron.
        </p>

        <ol className="relative mt-12 space-y-20 pl-7 md:pl-12">
          {/* Riel: fondo tenue y una línea ají que se llena mientras se avanza. */}
          <span
            aria-hidden="true"
            className="bg-aji/25 absolute inset-y-0 left-0 w-1 rounded-full"
          />
          <span
            aria-hidden="true"
            className="riel-avance bg-aji absolute inset-y-0 left-0 w-1 rounded-full"
          />
          {years.map(({ year, milestones, videos }) => {
            const images = milestones.flatMap((m) => m.images ?? []);
            return (
              <li
                key={year}
                className="relative grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)_19rem] lg:gap-10"
              >
                <span
                  aria-hidden="true"
                  className="bg-marino border-crema-200 absolute top-3 -left-[2.2rem] size-5 rounded-full border-4 md:-left-[3.45rem]"
                />
                <p
                  data-reveal
                  className="font-display text-marino self-start text-6xl leading-none font-semibold md:sticky md:top-28 md:text-7xl"
                >
                  {year}
                </p>

                <div className="min-w-0 space-y-6">
                  {milestones.map((m, index) => (
                    <div key={m.title} data-reveal="izq" style={{ "--i": index } as CSSProperties}>
                      <h3 className="text-2xl font-semibold">{m.title}</h3>
                      <p className="text-tinta-suave mt-2 max-w-xl text-lg">{m.text}</p>
                      {m.source ? (
                        <a
                          href={m.source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-marino-600 mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                        >
                          Fuente: {m.source.label}
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                          <span className="sr-only"> (abre en otra pestaña)</span>
                        </a>
                      ) : null}
                    </div>
                  ))}

                  {videos.length > 0 ? (
                    <div data-reveal>
                      <h3 className="text-rocoto-texto flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                        <Tv aria-hidden="true" className="size-4" />
                        En televisión
                      </h3>
                      <ul className="mt-3 grid gap-5 sm:grid-cols-2">
                        {videos.map((video) => (
                          <li key={video.id}>
                            <PressVideo
                              id={video.id}
                              title={video.title}
                              outlet={video.outlet}
                              dateLabel={formatMonthYear(video.date)}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div data-reveal="der">
                  <YearCollage images={images} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
