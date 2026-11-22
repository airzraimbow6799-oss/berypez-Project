"use client";

import dynamic from "next/dynamic";

/**
 * El contenedor de avisos (Sonner, ~34 KB) se carga aparte, después de que la página ya se ve
 * (#58). Los avisos solo aparecen tras una acción de la persona (agregar al carrito), cuando el
 * contenedor ya está montado.
 */
export const LazyToaster = dynamic(() => import("./Toaster").then((m) => m.Toaster), {
  ssr: false,
});
