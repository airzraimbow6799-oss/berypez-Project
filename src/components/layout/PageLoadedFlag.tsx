"use client";

import { useEffect } from "react";

/** Tope de espera a que el navegador quede libre antes de marcar la página como cargada. */
const IDLE_TIMEOUT_MS = 1500;

/**
 * Marca <html data-cargado> cuando la página terminó de cargar y el navegador está libre.
 * Lo decorativo que pesa (el fondo de mariscos, 108 KB) se pide recién entonces, para no
 * competir en celulares con la foto principal, las fuentes y el JavaScript (#58).
 */
export function PageLoadedFlag() {
  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const marcar = () => {
      document.documentElement.dataset.cargado = "true";
    };
    const alCargar = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(marcar, { timeout: IDLE_TIMEOUT_MS });
      } else {
        timeoutId = window.setTimeout(marcar, 300);
      }
    };
    if (document.readyState === "complete") {
      alCargar();
    } else {
      window.addEventListener("load", alCargar, { once: true });
    }
    return () => {
      window.removeEventListener("load", alCargar);
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
