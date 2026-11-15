import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div" | "li";
  children: ReactNode;
};

/** Superficie blanca con borde cálido. `article` por defecto: cada tarjeta es una unidad. */
export function Card({ as: Tag = "article", className, children, ...rest }: CardProps) {
  return (
    <Tag
      {...rest}
      className={cx("border-borde bg-superficie rounded-md border shadow-sm", className)}
    >
      {children}
    </Tag>
  );
}
