import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

export type ButtonVariant = "primario" | "secundario" | "fantasma" | "peligro";
export type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primario: "brillo bg-aji text-marino shadow-md hover:bg-aji-600 active:translate-y-px",
  secundario:
    "border-2 border-marino text-marino hover:bg-marino hover:text-crema active:translate-y-px",
  fantasma: "text-marino hover:bg-crema-200",
  peligro: "bg-rocoto-texto text-white hover:brightness-95 active:translate-y-px",
};

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-tactil px-6 text-base",
  lg: "min-h-14 px-8 text-lg",
};

const BASE =
  "rounded-pill inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-progress aria-busy:opacity-100";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
    isLoading?: boolean;
  };

type ButtonAsLink = CommonProps & { href: string; isLoading?: never };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Botón de la marca. Con `href` se vuelve enlace (la acción navega, no ejecuta). */
export function Button(props: ButtonProps) {
  const { variant = "primario", size = "md", className, children } = props;
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], className);

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    variant: _variant,
    size: _size,
    className: _className,
    children: _children,
    isLoading = false,
    type = "button",
    disabled,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={classes}
    >
      {isLoading ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : null}
      {children}
    </button>
  );
}
