import { FISH_VIEWBOX, LOGO_VIEWBOX, LogoPaths } from "./logo-paths";

type BrandLogoProps = {
  /** "completo": peces + nombre. "peces": solo el símbolo. */
  variant?: "completo" | "peces";
  className?: string;
};

/**
 * Logo vectorial de Berypez. Toma el color del texto (`currentColor`): marino en el header,
 * crema en el footer. Decorativo: el enlace que lo envuelve lleva el nombre accesible.
 */
export function BrandLogo({ variant = "completo", className }: BrandLogoProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={variant === "completo" ? LOGO_VIEWBOX : FISH_VIEWBOX}
      fill="currentColor"
      className={className}
    >
      <LogoPaths />
    </svg>
  );
}
