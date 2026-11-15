"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const TRACKING_INTERVAL_MS = 15_000;

/**
 * F3-11 · Actualiza el estado del pedido cada 15 s mientras la pestaña está visible.
 * Para el cliente se usa consulta periódica en vez de Realtime: no hace falta abrir la
 * tabla de pedidos a la clave pública (RLS sigue cerrada para anon).
 */
export function TrackingRefresher({ isFinal }: { isFinal: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (isFinal) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, TRACKING_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isFinal, router]);
  return null;
}
