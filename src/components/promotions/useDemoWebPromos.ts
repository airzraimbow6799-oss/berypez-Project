"use client";

import { useEffect, useState } from "react";

import type { DemoWebPromos } from "@/features/demo/apply-promos";

/**
 * Promociones del modo demostración para la web (las del panel de demostración guardadas en
 * este navegador, o las de ejemplo). Solo se descargan si `enabled`; mientras tanto, null.
 */
export function useDemoWebPromos(enabled: boolean): DemoWebPromos | null {
  const [data, setData] = useState<DemoWebPromos | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let isAlive = true;
    void import("@/features/demo/public-promos").then((m) => {
      if (isAlive) setData(m.demoWebPromos(Date.now()));
    });
    return () => {
      isAlive = false;
    };
  }, [enabled]);
  return enabled ? data : null;
}
