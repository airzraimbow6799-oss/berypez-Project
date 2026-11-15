import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "./cx";

type ChipProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  className?: string;
};

/** Filtro activable (sin picante, vegetariano…). El estado se ve con el check, no solo con color. */
export function Chip({ pressed, onPressedChange, children, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cx(
        "min-h-tactil rounded-pill inline-flex items-center gap-1.5 border px-4 text-sm font-semibold transition-colors",
        pressed
          ? "border-marino bg-marino text-crema"
          : "border-borde bg-superficie text-marino hover:border-marino-600",
        className,
      )}
    >
      {pressed ? <Check aria-hidden="true" className="size-4" /> : null}
      {children}
    </button>
  );
}
