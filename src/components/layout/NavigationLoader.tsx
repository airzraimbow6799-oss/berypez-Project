"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FishLoader } from "@/components/brand/FishLoader";
import { isPageNavigation } from "@/features/navigation/navigation";

/** Si la página nueva llega antes de esto, el velo no aparece (sin parpadeo). */
export const SHOW_DELAY_MS = 150;
/** Una vez visible, se queda al menos esto para que la animación se lea. */
export const MIN_VISIBLE_MS = 350;
/** Tope de seguridad por si la navegación falla. */
export const MAX_VISIBLE_MS = 10_000;

/**
 * Velo de transición entre páginas con los peces del logo (idea de Axel).
 * Escucha los clics en fase de captura (antes de que next/link los cancele) y se apaga
 * cuando cambia la ruta.
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const showTimer = useRef<number | undefined>(undefined);
  const safetyTimer = useRef<number | undefined>(undefined);
  const shownAt = useRef(0);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }
      const navigates = isPageNavigation(
        event,
        { href: link.href, target: link.target, hasDownload: link.hasAttribute("download") },
        new URL(window.location.href),
      );
      if (!navigates) {
        return;
      }
      // Desde aquí las páginas nuevas entran con un fundido (.pagina-entra); la primera carga no.
      document.documentElement.dataset.navegado = "true";
      window.clearTimeout(showTimer.current);
      showTimer.current = window.setTimeout(() => {
        shownAt.current = Date.now();
        setIsVisible(true);
      }, SHOW_DELAY_MS);
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = window.setTimeout(() => setIsVisible(false), MAX_VISIBLE_MS);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // La ruta cambió: la página nueva ya está. Cancelar el velo pendiente o retirarlo.
  useEffect(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(safetyTimer.current);
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const id = window.setTimeout(() => setIsVisible(false), wait);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams]);

  useEffect(
    () => () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(safetyTimer.current);
    },
    [],
  );

  return (
    <div
      aria-hidden={!isVisible}
      className={`bg-crema/75 fixed inset-0 z-[60] grid place-items-center backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {isVisible ? <FishLoader label="Abriendo la página" /> : null}
    </div>
  );
}
