interface WaveProps {
  /** Color de relleno (token CSS). */
  fill?: string;
  /** Voltea la ola para usarla en el borde inferior de una sección. */
  flip?: boolean;
  className?: string;
}

/**
 * Rasgo propio del sistema: el borde en ola marca dónde empieza el mar (footer marino).
 * Se usa con moderación: una ola por página. Decorativo, oculto para lectores de pantalla.
 */
export function Wave({ fill = "var(--color-marino)", flip = false, className = "" }: WaveProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 28"
      preserveAspectRatio="none"
      className={`block h-4 w-full sm:h-6 ${flip ? "rotate-180" : ""} ${className}`}
    >
      <path
        fill={fill}
        d="M0 28V12c120 10 240 14 360 6S600-2 720 4s240 22 360 18 240-18 360-14v20z"
      />
    </svg>
  );
}
