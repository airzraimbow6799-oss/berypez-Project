import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Confirmar pedido", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Confirmar pedido</h1>
      <p className="text-tinta-suave mt-2">
        Tres pasos cortos. Revisa el total antes de confirmar.
      </p>
      <CheckoutForm />
    </div>
  );
}
