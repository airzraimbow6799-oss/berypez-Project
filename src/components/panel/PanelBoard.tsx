"use client";

import { Bell, BellOff, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { toast } from "@/components/ui/Toaster";
import type { PanelOrder } from "@/features/orders/panel";
import { nextStatuses, type OrderStatus, STATUS_LABELS } from "@/features/orders/status";
import { formatPrice } from "@/lib/format";
import { beep } from "@/lib/beep";
import { createClient } from "@/lib/supabase/client";

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  in_kitchen: "Pasar a cocina",
  on_the_way: "Salió a reparto",
  ready_for_pickup: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelar",
};

const ACTIVE: readonly OrderStatus[] = [
  "pending",
  "received",
  "in_kitchen",
  "on_the_way",
  "ready_for_pickup",
];

/** F3-12 / F3-14 · Tablero en vivo: pedidos nuevos al instante, con sonido, y cambio de estado. */
export function PanelBoard({
  initialOrders,
  demo,
}: {
  initialOrders: PanelOrder[];
  /** Modo demostración: sin Supabase; los cambios se hacen sobre los datos de ejemplo. */
  demo?: { onAdvance: (id: number, status: OrderStatus) => void };
}) {
  const router = useRouter();
  const [onlyActive, setOnlyActive] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const soundRef = useRef(isSoundOn);
  soundRef.current = isSoundOn;

  useEffect(() => {
    if (demo) return;
    const supabase = createClient();
    const channel = supabase
      .channel("panel-pedidos")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          if (soundRef.current) beep();
          toast.success("Pedido nuevo");
        }
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, demo]);

  const advance = async (order: PanelOrder, status: OrderStatus) => {
    if (status === "cancelled" && !window.confirm(`¿Cancelar el pedido N.º ${order.id}?`)) return;
    if (demo) {
      demo.onAdvance(order.id, status);
      return;
    }
    setBusyId(order.id);
    const res = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) {
      toast.error(json?.error?.message ?? "No se pudo cambiar el estado.");
      return;
    }
    router.refresh();
  };

  const logout = async () => {
    if (demo) await fetch("/api/demo/login", { method: "DELETE" });
    else await createClient().auth.signOut();
    router.replace("/panel/ingresar");
    router.refresh();
  };

  const orders = onlyActive
    ? initialOrders.filter((o) => ACTIVE.includes(o.status))
    : initialOrders;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip pressed={onlyActive} onPressedChange={setOnlyActive}>
          Solo activos
        </Chip>
        <Chip
          pressed={isSoundOn}
          onPressedChange={(on) => {
            setIsSoundOn(on);
            if (on) beep();
          }}
        >
          {isSoundOn ? (
            <Bell aria-hidden="true" className="size-4" />
          ) : (
            <BellOff aria-hidden="true" className="size-4" />
          )}
          Sonido
        </Chip>
        <Button variant="fantasma" onClick={logout} className="ml-auto">
          <LogOut aria-hidden="true" className="size-5" /> Salir
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-tinta-suave mt-10 text-center text-lg">
          No hay pedidos activos. Los nuevos aparecen aquí al instante.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const actions = nextStatuses(order.status, order.modality);
            return (
              <li
                key={order.id}
                className="bg-superficie border-borde flex flex-col gap-3 rounded-md border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">
                      N.º {order.id} · {order.customerName}
                    </p>
                    <p className="text-tinta-suave text-sm">
                      {order.modality === "pickup"
                        ? `Recojo · ${order.branchName}`
                        : `Delivery · ${order.district}`}{" "}
                      ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Lima",
                      })}
                    </p>
                  </div>
                  <span className="bg-aji-100 rounded-pill px-3 py-1 text-sm font-semibold">
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
                        isLoading={busyId === order.id}
                        onClick={() => advance(order, status)}
                      >
                        {ACTION_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
