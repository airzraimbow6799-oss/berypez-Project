"use client";

import { useEffect, useRef } from "react";

type CountUpProps = {
  /** Número al que llega. También es el texto que ve quien no tiene JavaScript o pidió menos movimiento. */
  to: number;
  durationMs?: number;
};

/**
 * Número que cuenta hasta su valor cuando llega a la pantalla (por ejemplo, «14» años).
 * - Sin JavaScript o con «reducir movimiento» se ve el número final, sin cambios.
 * - Usa IntersectionObserver (nada de listeners de scroll) y actualiza el texto sin pasar por React.
 * - Reserva el ancho del número final para que contar no empuje el texto de al lado.
 */
export function CountUp({ to, durationMs = 1400 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    // Arranca en 0: la sección está más abajo de la portada, nadie ve el cambio de 14 a 0.
    element.textContent = "0";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = String(Math.round(to * eased));
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          }
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = String(to);
    };
  }, [to, durationMs]);

  return (
    <span
      ref={ref}
      className="inline-block text-right tabular-nums"
      style={{ minWidth: `${String(to).length}ch` }}
    >
      {to}
    </span>
  );
}
