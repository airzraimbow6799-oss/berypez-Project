"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

/**
 * Avisos breves (“Agregaste Ceviche al carrito”). Sonner los anuncia a lectores de pantalla
 * (región aria-live) y respeta reduced-motion. Montar una sola vez en el layout.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={88}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-marino !text-crema !border-0 !rounded-md !shadow-lg !font-sans !text-base !min-h-tactil",
          description: "!text-crema/85",
          actionButton: "!bg-aji !text-marino !font-semibold",
          closeButton: "!bg-marino !text-crema !border-crema/30",
          success: "[&_[data-icon]]:!text-limon",
          error: "!bg-rocoto-texto",
        },
      }}
    />
  );
}
