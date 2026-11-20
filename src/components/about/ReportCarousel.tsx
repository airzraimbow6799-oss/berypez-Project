"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatMonthYear, type PressVideo as PressVideoData } from "@/config/nosotros";

import { PressVideo } from "./PressVideo";

const AUTO_MS = 5000;

/**
 * Carrusel de los mejores reportajes. Avanza solo cada 5 s y se detiene:
 * con «reducir movimiento», al pasar el mouse o enfocar con el teclado, al tocar un video
 * y con el botón «Pausar» (WCAG 2.2.2: todo lo que se mueve solo se puede detener).
 */
export function ReportCarousel({ videos }: Readonly<{ videos: readonly PressVideoData[] }>) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersStill, setPrefersStill] = useState(true);

  useEffect(() => {
    setPrefersStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector("li");
    if (!track || !card) {
      return;
    }
    const width = card.getBoundingClientRect().width + 24;
    // Al llegar al último reportaje vuelve al primero (solo si de verdad hay desplazamiento).
    const canScroll = track.scrollWidth > track.clientWidth;
    const atEnd = canScroll && track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: direction * width, behavior: "smooth" });
  }, []);

  const isMoving = !isPaused && !isHovered && !prefersStill;

  useEffect(() => {
    if (!isMoving) {
      return;
    }
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        step(1);
      }
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [isMoving, step]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
      // Tocar un video lo reproduce: el carrusel deja de moverse para no llevárselo.
      onClickCapture={(event) => {
        if (trackRef.current?.contains(event.target as Node)) {
          setIsPaused(true);
        }
      }}
    >
      <ul
        ref={trackRef}
        aria-label="Reportajes sobre Berypez"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] gap-6 overflow-x-auto scroll-smooth px-4 pb-4"
      >
        {videos.map((video) => (
          <li key={video.id} className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
            <PressVideo
              id={video.id}
              title={video.title}
              outlet={video.outlet}
              dateLabel={formatMonthYear(video.date)}
            />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="border-marino text-marino hover:bg-marino hover:text-crema flex size-11 items-center justify-center rounded-full border-2 transition-colors"
          aria-label="Reportaje anterior"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          className="border-marino text-marino hover:bg-marino hover:text-crema flex size-11 items-center justify-center rounded-full border-2 transition-colors"
          aria-label="Reportaje siguiente"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
        {prefersStill ? null : (
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            className="text-marino-600 ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold hover:underline"
          >
            {isPaused ? (
              <Play aria-hidden="true" className="size-4" />
            ) : (
              <Pause aria-hidden="true" className="size-4" />
            )}
            {isPaused ? "Reanudar" : "Pausar"}
          </button>
        )}
      </div>
    </div>
  );
}
