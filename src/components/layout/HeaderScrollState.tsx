"use client";

import { useEffect, useRef } from "react";

/** Distancia de scroll a partir de la cual el encabezado se «asienta» (sombra y logo más chico). */
const UMBRAL_PX = 24;

/**
 * Marca el <header> con `data-scrolled` cuando la página ya bajó un poco. Solo cambia sombra,
 * fondo y la escala del logo (transform): el alto del encabezado no cambia, así nada salta.
 * Un solo listener pasivo y como mucho una lectura por cuadro.
 */
export function HeaderScrollState() {
  const marcadorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = marcadorRef.current?.closest("header");
    if (!header) {
      return;
    }
    let cuadro = 0;
    const actualizar = () => {
      cuadro = 0;
      header.dataset.scrolled = String(window.scrollY > UMBRAL_PX);
    };
    const alHacerScroll = () => {
      if (!cuadro) {
        cuadro = window.requestAnimationFrame(actualizar);
      }
    };
    actualizar();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.cancelAnimationFrame(cuadro);
    };
  }, []);

  return <span ref={marcadorRef} hidden />;
}
