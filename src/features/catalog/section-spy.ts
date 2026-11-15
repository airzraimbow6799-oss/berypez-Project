/**
 * Lógica pura de la barra de secciones de la carta (scroll-spy), separada del DOM para
 * poder probarla. Todas las medidas en píxeles relativas al viewport.
 */

/** Margen bajo la barra fija para dar una sección por "llegada". */
export const SPY_TOLERANCE_PX = 8;

/**
 * Índice de la sección activa: la última cuyo borde superior ya pasó bajo la barra.
 * Antes de la primera sección, la primera. Determinista: no depende del orden de eventos.
 */
export function activeSectionIndex(sectionTops: readonly number[], lineY: number): number {
  let active = 0;
  for (let i = 0; i < sectionTops.length; i += 1) {
    if ((sectionTops[i] ?? Infinity) <= lineY + SPY_TOLERANCE_PX) {
      active = i;
    }
  }
  return active;
}

/** scrollLeft que centra un chip dentro de su barra horizontal (sin mover la página). */
export function centeredScrollLeft(
  chip: { offsetLeft: number; width: number },
  bar: { width: number; scrollWidth: number },
): number {
  const ideal = chip.offsetLeft - (bar.width - chip.width) / 2;
  const max = Math.max(0, bar.scrollWidth - bar.width);
  return Math.min(Math.max(0, ideal), max);
}

/**
 * Posición absoluta (window.scrollY) que deja el título de la sección justo bajo la
 * barra fija. `stuckBottom` = distancia del borde inferior de la barra al tope del
 * viewport cuando ya está pegada.
 */
export function sectionScrollTarget(
  sectionTop: number,
  scrollY: number,
  stuckBottom: number,
): number {
  return Math.max(0, Math.round(scrollY + sectionTop - stuckBottom));
}

/** Margen para no mostrar una flecha por medio píxel de redondeo. */
const EDGE_PX = 2;

/** ¿Quedan secciones ocultas a la izquierda o a la derecha de la barra? */
export function scrollEdges(bar: { scrollLeft: number; width: number; scrollWidth: number }): {
  canLeft: boolean;
  canRight: boolean;
} {
  return {
    canLeft: bar.scrollLeft > EDGE_PX,
    canRight: bar.scrollLeft + bar.width < bar.scrollWidth - EDGE_PX,
  };
}

/** Destino al tocar una flecha: avanza ~¾ de la barra, sin pasarse de los extremos. */
export function arrowScrollLeft(
  bar: { scrollLeft: number; width: number; scrollWidth: number },
  direction: -1 | 1,
): number {
  const max = Math.max(0, bar.scrollWidth - bar.width);
  const target = bar.scrollLeft + direction * Math.round(bar.width * 0.75);
  return Math.min(Math.max(0, target), max);
}
