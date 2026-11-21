"use client";

import { useEffect, useRef } from "react";

type AnimatedNumberProps = {
  value: number;
  /** Convierte el número en texto (por ejemplo, céntimos a «S/ 120.00»). Debe ser estable. */
  format: (value: number) => string;
  durationMs?: number;
};

/**
 * Número que sube hasta su valor al aparecer y vuelve a contar cuando cambia.
 * - Sin JavaScript o con «reducir movimiento» se ve el valor final, sin contar.
 * - Actualiza el texto sin pasar por React en cada cuadro (como CountUp de la portada).
 * - Sirve para que la dueña vea que el dato «está vivo»: motivo, no adorno.
 */
export function AnimatedNumber({ value, format, durationMs = 900 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion =
      typeof window.matchMedia !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      shown.current = value;
      element.textContent = format(value);
      return;
    }
    const from = shown.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      shown.current = Math.round(from + (value - from) * eased);
      element.textContent = format(shown.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, format, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
