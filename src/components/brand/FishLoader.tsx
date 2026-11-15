import { cx } from "@/components/ui/cx";

import { FISH_VIEWBOX, FishPaths } from "./logo-paths";

type FishLoaderProps = {
  /** Texto para lectores de pantalla. */
  label?: string;
  className?: string;
};

/**
 * Animación de carga con los peces del logo (vectorial, solo CSS). Cada pez entra nadando
 * en secuencia y el cardumen se mece. Con movimiento reducido, los peces quedan quietos.
 */
export function FishLoader({ label = "Cargando", className }: FishLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cx("text-marino", className)}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={FISH_VIEWBOX}
        fill="currentColor"
        className="cardumen h-16 w-auto overflow-visible"
      >
        <FishPaths />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
