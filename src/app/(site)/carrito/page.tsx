import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Tu pedido</h1>
      <CartView />
    </div>
  );
}
