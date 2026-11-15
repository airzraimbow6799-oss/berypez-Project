import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CartButtonProps {
  /** Cantidad de platos. El estado real del carrito llega en F2-06. */
  count?: number;
}

export function CartButton({ count = 0 }: CartButtonProps) {
  const label = count === 1 ? "Carrito, 1 plato" : `Carrito, ${count} platos`;
  return (
    <Link
      href="/carrito"
      aria-label={label}
      className="bg-aji text-marino hover:bg-aji-600 size-tactil rounded-pill relative inline-flex items-center justify-center shadow-sm transition-colors"
    >
      <ShoppingBag aria-hidden="true" className="size-6" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="bg-marino text-crema rounded-pill absolute -top-1 -right-1 grid min-w-6 place-items-center px-1 text-xs font-bold tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
