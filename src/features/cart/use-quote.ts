"use client";

import { useEffect, useState } from "react";

import type { Quote } from "@/features/checkout/quote";

import type { CartLine } from "./cart";

export type QuoteRequest = {
  modality: "delivery" | "pickup";
  branchSlug: "lince" | "jesus-maria";
  district: string;
};

type QuoteState =
  | { status: "idle" | "loading"; quote: (Quote & { etaMinutes: number | null }) | null }
  | { status: "ready"; quote: Quote & { etaMinutes: number | null } }
  | { status: "error"; quote: null; message: string };

const DEBOUNCE_MS = 350;

/** Total real del carrito según el servidor (F2-01/F2-06). Cancela la consulta anterior. */
export function useQuote(lines: readonly CartLine[], request: QuoteRequest): QuoteState {
  const [state, setState] = useState<QuoteState>({ status: "idle", quote: null });
  const payload = JSON.stringify({
    ...request,
    items: lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      choices: l.choices,
      note: l.note,
    })),
  });

  useEffect(() => {
    if (lines.length === 0) {
      setState({ status: "idle", quote: null });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ status: "loading", quote: s.quote }));
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success) setState({ status: "ready", quote: json.data });
        else setState({ status: "error", quote: null, message: json.error.message });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setState({ status: "error", quote: null, message: "No pudimos calcular el total." });
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
    // payload resume lines y request: es la única dependencia real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return state;
}
