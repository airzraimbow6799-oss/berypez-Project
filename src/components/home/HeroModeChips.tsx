"use client";

import { Bike, CreditCard, type LucideIcon, MapPin, Store } from "lucide-react";

import { DELIVERY_FEE_FROM_CENTS } from "@/config/home";
import { BRANCHES } from "@/config/site";
import type { OrderMode } from "@/features/order-mode/mode";
import { useOrderMode } from "@/features/order-mode/use-order-mode";
import { formatPrice } from "@/lib/format";

type Chip = { icon: LucideIcon; text: string };

const PAYMENT: Chip = { icon: CreditCard, text: "Yape, Plin y tarjeta" };

/** Lo que la portada promete según la modalidad elegida: nunca contradice la cabecera. */
export function chipsFor(mode: OrderMode | null): Chip[] {
  if (mode?.modality === "pickup") {
    const branch = BRANCHES.find((b) => b.slug === mode.branch);
    return [
      { icon: Store, text: `Recojo en ${branch?.name ?? "tu sede"}, sin costo de envío` },
      ...(branch?.address ? [{ icon: MapPin, text: branch.address }] : []),
      PAYMENT,
    ];
  }
  const delivery = { icon: Bike, text: `Delivery desde ${formatPrice(DELIVERY_FEE_FROM_CENTS)}` };
  if (mode?.modality === "delivery") {
    return [delivery, PAYMENT];
  }
  return [delivery, { icon: Store, text: "Recojo en Lince o Jesús María" }, PAYMENT];
}

export function HeroModeChips({ tone = "normal" }: Readonly<{ tone?: "normal" | "claro" }>) {
  const [mode] = useOrderMode();
  const isLight = tone === "claro";
  return (
    <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Lo que ofrecemos">
      {chipsFor(mode).map(({ icon: Icon, text }) => (
        <li
          key={text}
          className={`flex items-center gap-2 text-sm font-medium ${isLight ? "text-crema/90" : "text-tinta-suave"}`}
        >
          <Icon
            aria-hidden="true"
            className={`size-5 ${isLight ? "text-aji" : "text-marino-600"}`}
          />
          {text}
        </li>
      ))}
    </ul>
  );
}
