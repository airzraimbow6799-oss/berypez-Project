"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/IconButton";

export const HERO_POSTER = "/media/hero-poster.jpg";
export const HERO_SOURCES = [
  { src: "/media/hero-540.mp4", media: "(max-width: 767px)" },
  { src: "/media/hero-720.mp4" },
] as const;

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** El video solo se carga si la persona no pidió menos movimiento ni ahorro de datos. */
export function canPlayMotion(win: Window): boolean {
  const reduced = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const connection = (win.navigator as Navigator & { connection?: NetworkInformation }).connection;
  const slow = connection?.saveData === true || /(^|-)2g$/.test(connection?.effectiveType ?? "");
  return !reduced && !slow;
}

/**
 * Video de presentación (F1-06). El póster (next/image, prioridad) es lo primero que se ve
 * y el elemento LCP; el video se pide después de la carga, sin audio, en bucle, y se puede
 * pausar (WCAG 2.2.2). Es decorativo: lo que cuenta ya está en el texto del HERO.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  useEffect(() => {
    if (!canPlayMotion(window)) {
      return;
    }
    // Se pide después de que la página ya es interactiva para no competir con el LCP.
    const id = window.setTimeout(() => setShouldLoad(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      setIsPausedByUser(false);
      void video.play().catch(() => setIsPlaying(false));
    } else {
      setIsPausedByUser(true);
      video.pause();
    }
  };

  return (
    <div className="bg-marino-800 relative aspect-video overflow-hidden rounded-lg shadow-lg">
      <Image
        src={HERO_POSTER}
        alt="Ilustración de Berypez: ceviche, chicharrón de calamar y arroz con mariscos frente al mar"
        fill
        priority
        sizes="(min-width: 1024px) 560px, 100vw"
        className="object-cover"
      />
      {shouldLoad ? (
        <video
          ref={videoRef}
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            isPlaying || isPausedByUser ? "opacity-100" : "opacity-0"
          }`}
        >
          {HERO_SOURCES.map((source) => (
            <source
              key={source.src}
              src={source.src}
              type="video/mp4"
              {...("media" in source ? { media: source.media } : {})}
            />
          ))}
        </video>
      ) : null}
      {shouldLoad ? (
        <IconButton
          label={isPlaying ? "Pausar video" : "Reproducir video"}
          icon={
            isPlaying ? (
              <Pause aria-hidden="true" className="size-5" />
            ) : (
              <Play aria-hidden="true" className="size-5" />
            )
          }
          onClick={toggle}
          className="bg-marino/70 text-crema hover:bg-marino absolute right-3 bottom-3 backdrop-blur"
        />
      ) : null}
    </div>
  );
}
