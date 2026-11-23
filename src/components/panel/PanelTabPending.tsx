"use client";

import { useLinkStatus } from "next/link";

/**
 * Indicador dentro de la pestaña del panel que se acaba de tocar: responde al instante mientras
 * el servidor prepara la sección (sin tapar la pantalla con un esqueleto).
 */
export function PanelTabPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`ml-2 size-2 rounded-full bg-current transition-opacity ${pending ? "animate-pulse opacity-100" : "opacity-0"}`}
    />
  );
}
