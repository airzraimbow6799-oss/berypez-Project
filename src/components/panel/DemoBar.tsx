"use client";

import {
  Bell,
  BellOff,
  CalendarCheck,
  FlaskConical,
  LogOut,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useDemoReady } from "@/components/panel/useDemoReady";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { type DemoNotification, useDemoStore } from "@/features/demo/store";
import type { StaffRole } from "@/features/staff/roles";
import { beep } from "@/lib/beep";

/** Qué avisos ve cada rol: recepción las reservas, administración todo. */
export function isForRole(notification: Pick<DemoNotification, "kind">, role: StaffRole): boolean {
  if (role === "admin") return true;
  return notification.kind === "reservation";
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });

/**
 * Franja del modo demostración: avisa que los datos son de ejemplo y permite simular la llegada
 * de pedidos y reservas para ver los avisos en vivo (campana, mensaje y sonido), reiniciar o
 * cambiar de rol.
 */
export function DemoBar({ role }: { role: StaffRole }) {
  const router = useRouter();
  const isReady = useDemoReady();
  const reset = useDemoStore((s) => s.reset);
  const notifications = useDemoStore((s) => s.notifications);
  const simulateOrder = useDemoStore((s) => s.simulateOrder);
  const simulateReservation = useDemoStore((s) => s.simulateReservation);
  const markAllRead = useDemoStore((s) => s.markAllRead);

  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const soundRef = useRef(isSoundOn);
  soundRef.current = isSoundOn;

  const mine = notifications.filter((n) => isForRole(n, role));
  const unread = mine.filter((n) => !n.isRead).length;

  // Aviso al llegar algo nuevo (no al montar la franja con avisos viejos).
  const lastSeen = useRef<number | null>(useDemoStore.getState().notifications[0]?.id ?? null);
  const latest = notifications[0];
  useEffect(() => {
    if (!latest || lastSeen.current === latest.id) return;
    lastSeen.current = latest.id;
    if (!isForRole(latest, role)) return;
    toast.success(`${latest.title} · ${latest.detail}`);
    if (soundRef.current) beep();
  }, [latest, role]);

  const leave = async () => {
    await fetch("/api/demo/login", { method: "DELETE" });
    router.replace("/panel/ingresar");
    router.refresh();
  };

  const onReservation = () => {
    if (!simulateReservation()) toast.error("No quedó cupo para simular otra reserva.");
  };

  return (
    <>
      <div
        role="region"
        aria-label="Modo demostración"
        className="bg-aji-100 border-aji text-marino border-b"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical aria-hidden="true" className="size-4" />
            Modo demostración
            <span className="text-tinta-suave font-normal">
              Los datos son de ejemplo y se reinician al recargar la página.
            </span>
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <Button
              variant="fantasma"
              className="px-3 text-sm"
              disabled={!isReady}
              aria-label="Simular pedido"
              title="Simular pedido"
              onClick={() => simulateOrder()}
            >
              <ShoppingBag aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Simular pedido</span>
            </Button>
            <Button
              variant="fantasma"
              className="px-3 text-sm"
              disabled={!isReady}
              aria-label="Simular reserva"
              title="Simular reserva"
              onClick={onReservation}
            >
              <CalendarCheck aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Simular reserva</span>
            </Button>
            <Button
              variant="fantasma"
              className="relative px-3 text-sm"
              aria-label={`Avisos, ${unread} sin leer`}
              onClick={() => setIsOpen(true)}
            >
              <Bell aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Avisos</span>
              {unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="bg-rocoto-texto rounded-pill min-w-6 px-1.5 text-center text-xs font-bold text-white tabular-nums"
                >
                  {unread}
                </span>
              ) : null}
            </Button>
            <Button
              variant="fantasma"
              className="px-3 text-sm"
              aria-label="Reiniciar datos"
              title="Reiniciar datos"
              onClick={() => {
                reset();
                toast.success("Datos de ejemplo reiniciados");
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Reiniciar datos</span>
            </Button>
            <Button
              variant="fantasma"
              className="px-3 text-sm"
              aria-label="Cambiar de rol"
              title="Cambiar de rol"
              onClick={leave}
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden md:inline">Cambiar de rol</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        variant="drawer"
        title="Avisos"
        description="Llegan solos al panel, sin recargar la página."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <Button variant="secundario" disabled={unread === 0} onClick={markAllRead}>
              Marcar todo como leído
            </Button>
          </div>
        }
      >
        {mine.length === 0 ? (
          <div className="border-borde rounded-md border border-dashed p-6 text-center">
            <p className="font-semibold">Todavía no hay avisos</p>
            <p className="text-tinta-suave mt-1 text-sm">
              Usa «Simular pedido» o «Simular reserva» para ver cómo llegan.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((n) => (
              <li
                key={n.id}
                className={`border-borde flex gap-3 rounded-md border p-3 ${n.isRead ? "bg-superficie" : "bg-aji-100"}`}
              >
                {n.kind === "order" ? (
                  <ShoppingBag aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                ) : (
                  <CalendarCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    {n.title}
                    {n.isRead ? null : <span className="sr-only"> (sin leer)</span>}
                  </p>
                  <p className="text-tinta-suave text-sm">{n.detail}</p>
                  <p className="text-tinta-suave mt-0.5 text-xs tabular-nums">{timeOf(n.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
