import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** Nombre accesible obligatorio: el botón no tiene texto visible. */
  label: string;
  icon: ReactNode;
  tone?: "claro" | "aji";
};

export function IconButton({
  label,
  icon,
  tone = "claro",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "size-tactil rounded-pill inline-flex shrink-0 items-center justify-center transition-colors disabled:opacity-50",
        tone === "aji" ? "bg-aji text-marino hover:bg-aji-600" : "text-marino hover:bg-crema-200",
        className,
      )}
    >
      {icon}
    </button>
  );
}
