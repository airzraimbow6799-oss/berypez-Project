"use client";

import { useEffect } from "react";

import { useDemoStore } from "@/features/demo/store";

/**
 * Prepara los datos de ejemplo al montar y avisa cuando están listos. Hasta entonces las
 * pantallas muestran un esqueleto, así el servidor y el navegador no generan horas distintas.
 */
export function useDemoReady(): boolean {
  const isReady = useDemoStore((s) => s.isReady);
  const ensureReady = useDemoStore((s) => s.ensureReady);
  useEffect(() => {
    ensureReady();
  }, [ensureReady]);
  return isReady;
}
