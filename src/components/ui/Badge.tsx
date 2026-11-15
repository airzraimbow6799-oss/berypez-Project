import type { ReactNode } from "react";

import { cx } from "./cx";

export type BadgeTone = "neutro" | "picante" | "vegetariano" | "favorito" | "promo" | "agotado";

const TONES: Record<BadgeTone, string> = {
  neutro: "bg-crema-200 text-marino",
  picante: "bg-rocoto-texto/10 text-rocoto-texto",
  vegetariano: "bg-limon-100 text-limon-texto",
  favorito: "bg-aji-100 text-marino",
  promo: "bg-rocoto text-white",
  agotado: "bg-marino text-crema",
};

type BadgeProps = {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Etiqueta informativa. Siempre lleva texto: el color nunca es el único indicador. */
export function Badge({ tone = "neutro", icon, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "rounded-pill inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
