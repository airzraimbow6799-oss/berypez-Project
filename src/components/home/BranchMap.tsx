"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

type Props = {
  branchName: string;
  embedUrl: string;
};

/**
 * Mapa de Google Maps que se carga al tocar (fachada): Google no descarga nada ni deja
 * cookies hasta que la persona lo pide, y la portada no paga el peso del iframe.
 */
export function BranchMap({ branchName, embedUrl }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

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
