import { CircleCheck, CircleX, ChefHat, Inbox, Truck, type LucideIcon } from "lucide-react";

import type { StatusGroupKey } from "@/features/orders/status";

/**
 * Color e ícono de cada apartado del tablero de pedidos. El color nunca va solo: siempre lo
 * acompañan el nombre del estado y un ícono (no depende de distinguir colores).
 */
export const STATUS_STYLE: Record<
  StatusGroupKey,
  { icon: LucideIcon; card: string; badge: string; dot: string }
> = {
  received: {
    icon: Inbox,
    card: "border-rocoto bg-superficie",
    badge: "bg-rocoto/10 text-rocoto-texto",
    dot: "bg-rocoto",
  },
  in_kitchen: {
    icon: ChefHat,
    card: "border-aji-600 bg-superficie",
    badge: "bg-aji-100 text-marino",
    dot: "bg-aji",
  },
  ready: {
    icon: Truck,
    card: "border-marino-600 bg-superficie",
    badge: "bg-marino-600 text-crema",
    dot: "bg-marino-600",
  },
  delivered: {
    icon: CircleCheck,
    card: "border-limon bg-limon-100/40",
    badge: "bg-limon-100 text-limon-texto",
    dot: "bg-limon",
  },
  cancelled: {
    icon: CircleX,
    card: "border-borde bg-crema-200",
    badge: "bg-crema-200 text-tinta-suave",
    dot: "bg-tinta-suave",
  },
};
