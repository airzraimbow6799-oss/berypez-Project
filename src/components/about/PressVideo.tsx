"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Props = {
  id: string;
  title: string;
  outlet: string;
  dateLabel: string;
};

/**
 * Video de YouTube que se carga al tocarlo (fachada, como los mapas): hasta entonces solo se
 * muestra la miniatura guardada en la web, sin pedir nada a YouTube ni dejar cookies.
 * Al tocar se usa youtube-nocookie.com.
 */
export function PressVideo({ id, title, outlet, dateLabel }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="bg-marino relative aspect-video overflow-hidden rounded-md shadow-sm">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={`${title} (${outlet})`}
            className="absolute inset-0 size-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 size-full"
          >
            <Image
              src={`/nosotros/videos/${id}.webp`}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="bg-marino/0 group-hover:bg-marino/20 absolute inset-0 transition-colors" />
            <span className="bg-aji text-marino absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110">
              <Play aria-hidden="true" className="ml-0.5 size-6 fill-current" />
            </span>
            <span className="sr-only">
              Ver «{title}» de {outlet}
            </span>
          </button>
        )}
      </div>
      <figcaption>
        <p className="text-rocoto-texto text-xs font-semibold tracking-wide uppercase">
          {outlet} · {dateLabel}
        </p>
        <p className="text-marino mt-1 font-semibold">{title}</p>
      </figcaption>
    </figure>
  );
}
