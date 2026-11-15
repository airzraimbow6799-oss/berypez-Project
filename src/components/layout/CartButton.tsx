"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cartCount } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";

interface CartButtonProps {
  /** Para tests y vitrina. Sin valor, usa el carrito real. */
  count?: number;
}

export function CartButton({ count }: CartButtonProps) {
  const lines = useCart((state) => state.lines);
  // El carrito vive en localStorage: hasta montar se muestra 0 para no desalinear el HTML del servidor.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const total = count ?? (isMounted ? cartCount(lines) : 0);
  const label = total === 1 ? "Carrito, 1 plato" : `Carrito, ${total} platos`;

  return (
    <Link
      href="/carrito"
      aria-label={label}
      className="bg-aji text-marino hover:bg-aji-600 size-tactil rounded-pill relative inline-flex shrink-0 items-center justify-center shadow-sm transition-colors"
    >
      <ShoppingBag aria-hidden="true" className="size-6" />
      {total > 0 ? (
        <span
          key={total}
          aria-hidden="true"
          className="contador-rebote bg-marino text-crema rounded-pill absolute -top-1 -right-1 grid min-w-6 place-items-center px-1 text-xs font-bold tabular-nums"
        >
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </Link>
  );
}
