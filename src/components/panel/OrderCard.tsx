"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import type { PanelOrder } from "@/features/orders/panel";
import {
  nextStatuses,
  type OrderStatus,
  STATUS_LABELS,
  statusGroup,
} from "@/features/orders/status";
import { formatPrice } from "@/lib/format";

import { STATUS_STYLE } from "./order-status-style";

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  in_kitchen: "Pasar a cocina",
  on_the_way: "Salió a reparto",
  ready_for_pickup: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelar",
};

const TIME = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Lima",
});

/** Tarjeta de un pedido: el color y el ícono dicen en qué estado está. */
export function OrderCard({
  order,
  isBusy,
  onAdvance,
}: {
  order: PanelOrder;
  isBusy: boolean;
  onAdvance: (order: PanelOrder, status: OrderStatus) => void;
}) {
  const style = STATUS_STYLE[statusGroup(order.status)];
  const Icon = style.icon;
  const actions = nextStatuses(order.status, order.modality);

  return (
    <li className={cx("flex flex-col gap-3 rounded-md border-2 p-4 shadow-sm", style.card)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-semibold break-words">
            N.º {order.id} · {order.customerName}
          </p>
          <p className="text-tinta-suave text-sm">
            {order.modality === "pickup"
              ? `Recojo · ${order.branchName}`
              : `Delivery · ${order.district}`}{" "}
            · {TIME.format(new Date(order.createdAt))}
          </p>
        </div>
        <span
          className={cx(
            "rounded-pill inline-flex shrink-0 items-center gap-1.5 px-3 py-1 text-sm font-semibold",
            style.badge,
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      {order.scheduledFor ? (
        <p className="text-rocoto-texto text-sm font-semibold">
          Programado:{" "}
          {new Date(order.scheduledFor).toLocaleString("es-PE", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Lima",
          })}
        </p>
      ) : null}
      <ul className="text-sm">
        {order.items.map((item, i) => (
          <li key={i}>
            <strong>{item.quantity} ×</strong> {item.name}
            {item.variantLabel ? ` · ${item.variantLabel}` : ""}
            {item.choices.length > 0 ? (
              <span className="text-tinta-suave"> ({item.choices.join(", ")})</span>
            ) : null}
            {item.notes ? (
              <span className="text-rocoto-texto block">Nota: {item.notes}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {order.address ? <p className="text-sm">📍 {order.address}</p> : null}
      {order.notes ? <p className="text-sm">💬 {order.notes}</p> : null}
      <p className="text-sm">
        <a
          href={`tel:+51${order.customerPhone}`}
          className="min-h-tactil -my-3 inline-flex items-center underline underline-offset-4"
        >
          {order.customerPhone}
        </a>{" "}
        · {formatPrice(order.totalCents)} ·{" "}
        {order.paymentMethod === "cash" ? "Efectivo" : order.paymentMethod}
      </p>
      {actions.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2">
          {actions.map((status) => (
            <Button
              key={status}
              variant={status === "cancelled" ? "fantasma" : "primario"}
              isLoading={isBusy}
              onClick={() => onAdvance(order, status)}
            >
              {ACTION_LABELS[status]}
            </Button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
