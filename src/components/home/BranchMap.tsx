"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  branchName: string;
  embedUrl: string;
};

/** Distancia antes de llegar al mapa en la que empieza a cargarse (así ya está listo al verlo). */
const PRELOAD_MARGIN = "400px 0px";

/**
 * Mapa de Google Maps que se carga solo al acercarse a él con el scroll: la portada no paga el
 * peso del iframe al abrir, pero quien baja hasta las sedes ya lo ve sin tocar nada.
 * Si el navegador no tiene IntersectionObserver, queda el botón para cargarlo.
 */
export function BranchMap({ branchName, embedUrl }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const placeholderRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = placeholderRef.current;
    if (isLoaded || !element || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoaded]);

  if (isLoaded) {
    return (
      <iframe
        src={embedUrl}
        title={`Mapa de la sede ${branchName}`}
        className="border-borde aspect-[4/3] w-full rounded-md border sm:aspect-video"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <button
      ref={placeholderRef}
      type="button"
      onClick={() => setIsLoaded(true)}
      className="border-borde bg-crema text-tinta hover:border-marino-600 focus-visible:border-marino-600 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed font-semibold sm:aspect-video"
    >
      <MapPin aria-hidden="true" className="text-rocoto-texto size-8" />
      Ver mapa de {branchName}
      <span className="text-tinta-suave text-sm font-normal">Se abre con Google Maps</span>
    </button>
  );
}
