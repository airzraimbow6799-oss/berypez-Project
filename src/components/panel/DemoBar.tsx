"use client";

import { FlaskConical, LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { useDemoStore } from "@/features/demo/store";

/** Franja del modo demostración: avisa que los datos son de ejemplo y permite reiniciar o salir. */
export function DemoBar() {
  const router = useRouter();
  const reset = useDemoStore((s) => s.reset);

  const leave = async () => {
    await fetch("/api/demo/login", { method: "DELETE" });
    router.replace("/panel/ingresar");
    router.refresh();
  };

  return (
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
        <div className="ml-auto flex gap-1">
          <Button
            variant="fantasma"
            className="px-3 text-sm"
            onClick={() => {
              reset();
              toast.success("Datos de ejemplo reiniciados");
            }}
          >
            <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar datos
          </Button>
          <Button variant="fantasma" className="px-3 text-sm" onClick={leave}>
            <LogOut aria-hidden="true" className="size-4" /> Cambiar de rol
          </Button>
        </div>
      </div>
    </div>
  );
}
