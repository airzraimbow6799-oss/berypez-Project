"use client";

import { Bell, BellOff, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/cx";
import { toast } from "@/components/ui/Toaster";
import type { PanelOrder } from "@/features/orders/panel";
import {
  ACTIVE_GROUPS,
  groupByStatus,
  type OrderStatus,
  STATUS_GROUPS,
  type StatusGroupKey,
} from "@/features/orders/status";
import { beep } from "@/lib/beep";
import { createClient } from "@/lib/supabase/client";

import { OrderCard } from "./OrderCard";
import { STATUS_STYLE } from "./order-status-style";

/** Qué apartados se ven: los activos (por defecto), uno solo o todos. */
type View = "activos" | "todos" | StatusGroupKey;

const ALL_GROUPS = STATUS_GROUPS.map((g) => g.key);

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
  const [view, setView] = useState<View>("activos");
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

  const groups = groupByStatus(initialOrders);
  const count = (keys: readonly StatusGroupKey[]) =>
    keys.reduce((total, key) => total + groups[key].length, 0);
  const visible: readonly StatusGroupKey[] =
    view === "activos" ? ACTIVE_GROUPS : view === "todos" ? ALL_GROUPS : [view];
  const views: { key: View; label: string; total: number; dot?: string }[] = [
    { key: "activos", label: "Activos", total: count(ACTIVE_GROUPS) },
    ...STATUS_GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      total: groups[g.key].length,
      dot: STATUS_STYLE[g.key].dot,
    })),
    { key: "todos", label: "Todos", total: initialOrders.length },
  ];
  const shown = visible.filter((key) => groups[key].length > 0 || visible.length === 1);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
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

      <div
        role="group"
        aria-label="Ver pedidos por estado"
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {views.map((v) => (
          <Chip key={v.key} pressed={view === v.key} onPressedChange={() => setView(v.key)}>
            {v.dot ? (
              <span aria-hidden="true" className={cx("size-2.5 shrink-0 rounded-full", v.dot)} />
            ) : null}
            <span className="whitespace-nowrap">
              {v.label} ({v.total})
            </span>
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-tinta-suave mt-10 text-center text-lg">
          No hay pedidos activos. Los nuevos aparecen aquí al instante.
        </p>
      ) : (
        shown.map((key) => {
          const group = STATUS_GROUPS.find((g) => g.key === key);
          const orders = groups[key];
          return (
            <section key={key} aria-labelledby={`pedidos-${key}`} className="mt-6">
              <h2 id={`pedidos-${key}`} className="flex items-center gap-2 text-xl font-semibold">
                <span
                  aria-hidden="true"
                  className={cx("size-3 rounded-full", STATUS_STYLE[key].dot)}
                />
                {group?.label}{" "}
                <span className="text-tinta-suave font-normal">({orders.length})</span>
              </h2>
              {orders.length === 0 ? (
                <p className="text-tinta-suave mt-2">No hay pedidos en este estado.</p>
              ) : (
                <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isBusy={busyId === order.id}
                      onAdvance={advance}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
