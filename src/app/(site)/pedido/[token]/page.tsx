import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { TrackingRefresher } from "@/components/orders/TrackingRefresher";
import { Button } from "@/components/ui/Button";
import { getOrderByToken } from "@/features/checkout/server";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi pedido", robots: { index: false, follow: false } };

const STEPS = [
  { status: "received", label: "Recibido" },
  { status: "in_kitchen", label: "En cocina" },
  { status: "on_the_way", label: "En camino" },
  { status: "delivered", label: "Entregado" },
] as const;

const PICKUP_STEPS = [
  { status: "received", label: "Recibido" },
  { status: "in_kitchen", label: "En cocina" },
  { status: "ready_for_pickup", label: "Listo para recoger" },
  { status: "delivered", label: "Entregado" },
] as const;

/** F2-12 · Pedido recibido. En la Fase 3 se actualiza en vivo (F3-11). */
export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const token = z.uuid().safeParse((await params).token);
  if (!token.success) notFound();
  const order = await getOrderByToken(token.data);
  if (!order) notFound();

  const steps = order.modality === "pickup" ? PICKUP_STEPS : STEPS;
  // "pending" (recién creado) cuenta como recibido.
  const current = order.status === "pending" ? "received" : order.status;
  const currentIndex = steps.findIndex((s) => s.status === current);
  // Relación muchos-a-uno: PostgREST devuelve un objeto, aunque los tipos generados digan arreglo.
  const branchRef = order.branches as unknown as { name: string } | Array<{ name: string }> | null;
  const branchName = (Array.isArray(branchRef) ? branchRef[0]?.name : branchRef?.name) ?? "";
  const scheduled = order.scheduled_for
    ? new Intl.DateTimeFormat("es-PE", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "America/Lima",
      }).format(new Date(order.scheduled_for))
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 pb-16">
      <TrackingRefresher isFinal={order.status === "delivered" || order.status === "cancelled"} />
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 aria-hidden="true" className="text-limon-texto size-16" />
        <h1 className="mt-3 text-4xl font-semibold">¡Pedido recibido!</h1>
        <p className="text-tinta-suave mt-2 text-lg">
          Pedido N.º <strong className="text-marino">{order.id}</strong> ·{" "}
          {order.modality === "pickup" ? `Recojo en ${branchName}` : `Delivery a ${order.district}`}
        </p>
        {scheduled ? <p className="mt-1 font-semibold">Programado para el {scheduled}</p> : null}
      </div>

      <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Estado del pedido">
        {steps.map((step, index) => {
          const isDone = index <= currentIndex;
          return (
            <li
              key={step.status}
              aria-current={index === currentIndex ? "step" : undefined}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className={`h-2 w-full rounded-full ${isDone ? "bg-limon" : "bg-crema-200"}`} />
              <span className={`text-sm ${isDone ? "font-semibold" : "text-tinta-suave"}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <section
        aria-labelledby="detalle"
        className="border-borde bg-superficie mt-8 rounded-md border p-5 shadow-sm"
      >
        <h2 id="detalle" className="text-xl font-semibold">
          Detalle
        </h2>
        <ul className="mt-3 space-y-2">
          {order.order_items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span>
                {item.quantity} × {item.product_name}
                {item.variant_label ? (
                  <span className="text-tinta-suave"> · {item.variant_label}</span>
                ) : null}
                {item.notes ? (
                  <span className="text-tinta-suave block text-sm">Nota: {item.notes}</span>
                ) : null}
              </span>
              <span className="tabular-nums">{formatPrice(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="border-borde mt-4 space-y-1 border-t pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="tabular-nums">
              {order.delivery_cents ? formatPrice(order.delivery_cents) : "Gratis"}
            </dd>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
        <p className="text-tinta-suave mt-3 text-sm">
          Pagas en efectivo al {order.modality === "pickup" ? "recoger" : "recibir"}.
        </p>
      </section>

      <p className="text-tinta-suave mt-6 text-center text-sm">
        Guarda este enlace para ver el estado de tu pedido.
      </p>
      <div className="mt-4 flex justify-center">
        <Button href="/carta/marina" variant="secundario">
          Volver a la carta
        </Button>
      </div>
    </div>
  );
}
