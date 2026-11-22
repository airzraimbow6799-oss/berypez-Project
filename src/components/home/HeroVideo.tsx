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

/** Sin requestIdleCallback (Safari), se espera esto tras la carga antes de pedir el video. */
export const VIDEO_FALLBACK_DELAY_MS = 1200;
/** Tope de espera a que el navegador quede libre (requestIdleCallback). */
const VIDEO_IDLE_TIMEOUT_MS = 2500;

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
type HeroVideoProps = {
  /**
   * «fondo»: ocupa todo su contenedor (portada a pantalla completa), con una capa marino encima
   * para que el texto se lea; el botón de pausa va arriba a la derecha.
   * «ventana»: el recuadro 16:9 de antes.
   */
  variant?: "ventana" | "fondo";
  /** Clases de la capa de color sobre el video (solo «fondo»). */
  overlayClassName?: string;
};

export function HeroVideo({
  variant = "ventana",
  overlayClassName = "",
}: Readonly<HeroVideoProps>) {
  const isBackground = variant === "fondo";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  useEffect(() => {
    if (!canPlayMotion(window)) {
      return;
    }
    // #58: el video (1.5 MB) se pide recién cuando la página terminó de cargar y el navegador
    // está libre. Antes salía a los 400 ms y competía en 4G con la foto principal y las fuentes.
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const pedirVideo = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => setShouldLoad(true), {
          timeout: VIDEO_IDLE_TIMEOUT_MS,
        });
      } else {
        timeoutId = window.setTimeout(() => setShouldLoad(true), VIDEO_FALLBACK_DELAY_MS);
      }
    };
    if (document.readyState === "complete") {
      pedirVideo();
    } else {
      window.addEventListener("load", pedirVideo, { once: true });
    }
    return () => {
      window.removeEventListener("load", pedirVideo);
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
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
    <div
      className={
        isBackground
          ? "group bg-marino-800 absolute inset-0 overflow-hidden"
          : "group bg-marino-800 relative aspect-video overflow-hidden rounded-lg shadow-lg"
      }
    >
      <Image
        src={HERO_POSTER}
        alt="Ilustración de Berypez: ceviche, chicharrón de calamar y arroz con mariscos frente al mar"
        fill
        priority
        // #58: `priority` solo precarga; sin fetchPriority el navegador la pedía con prioridad
        // baja, detrás de las fuentes y el JS, y la portada tardaba en verse en celular.
        fetchPriority="high"
        sizes={isBackground ? "100vw" : "(min-width: 1024px) 560px, 100vw"}
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
          // QA-008: sin los botones que el navegador pinta encima (imagen en imagen y enviar a
          // otro dispositivo). El video es decorativo y no tiene controles propios del navegador.
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
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
      {isBackground ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${overlayClassName}`}
        />
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
          // QA-008: discreto pero siempre alcanzable (WCAG 2.2.2, el video va en bucle).
          // Con mouse aparece al pasar sobre el video o con el teclado (foco); sin mouse (celular)
          // queda visible y tenue, porque ahí no hay "pasar por encima". Pausado, siempre visible.
          className={`bg-marino/50 text-crema hover:bg-marino focus-visible:bg-marino absolute right-3 ${isBackground ? "top-[3.25rem]" : "bottom-3"} backdrop-blur transition-opacity duration-200 focus-visible:opacity-100 ${
            isPausedByUser
              ? "opacity-100"
              : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
          }`}
        />
      ) : null}
    </div>
  );
}
