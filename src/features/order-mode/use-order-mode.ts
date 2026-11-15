"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { MODE_CHANGE_EVENT, type OrderMode, parseMode, writeStoredMode } from "./mode";

const STORAGE_KEY = "berypez:modo-pedido";
/** Respaldo en memoria SOLO si el navegador bloquea el almacenamiento (modo privado). */
let memoryRaw: string | null = null;
let isStorageBlocked = false;

function session(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function readRaw(): string | null {
  if (isStorageBlocked) return memoryRaw;
  try {
    return session()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** ¿Se guardó de verdad? Si no, la sesión sigue en memoria. */
function rememberWrite(raw: string): void {
  let saved: string | null = null;
  try {
    saved = session()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    saved = null;
  }
  isStorageBlocked = saved !== raw;
  memoryRaw = raw;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(MODE_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(MODE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Modalidad del pedido compartida por toda la página: si se cambia en la cabecera,
 * la portada, el carrito y el checkout lo ven al instante. En el servidor vale null.
 */
export function useOrderMode(): [OrderMode | null, (mode: OrderMode) => void] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const mode = useMemo(() => parseMode(raw), [raw]);
  const setMode = useCallback((next: OrderMode) => {
    const raw = JSON.stringify(next);
    try {
      session()?.setItem(STORAGE_KEY, raw);
    } catch {
      // Bloqueado: rememberWrite lo detecta y usa la memoria.
    }
    rememberWrite(raw);
    // writeStoredMode avisa a toda la página (y reintenta guardar sin romper nada).
    writeStoredMode(session(), next);
  }, []);
  return [mode, setMode];
}
