import { flushSync } from "react-dom";

type DocumentWithTransitions = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => unknown;
};

/** Nombre compartido: la foto del plato en la tarjeta y en la vista rápida. */
export const PLATO_FOTO = "plato-foto";

/**
 * La foto «viaja» de `origen` a su lugar nuevo (View Transitions del navegador). `update` hace el
 * cambio de estado (p. ej. abrir la vista rápida). Sin soporte, con «reducir movimiento» o sin
 * foto de origen, solo hace el cambio: nunca deja de funcionar.
 */
export function morphTo(origen: HTMLElement | null, update: () => void): void {
  const doc = document as DocumentWithTransitions;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (!origen || reduced || typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  origen.style.viewTransitionName = PLATO_FOTO;
  try {
    doc.startViewTransition(async () => {
      origen.style.viewTransitionName = "";
      flushSync(update);
      // El <dialog> se abre en un efecto: un cuadro después ya está en pantalla para la foto final.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
  } catch {
    origen.style.viewTransitionName = "";
    update();
  }
}
