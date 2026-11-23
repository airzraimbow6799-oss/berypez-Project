import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Pantalla de carga al cambiar de sección del panel (Resumen, Pedidos, Reservas, Carta…).
 * Con ella el clic responde al instante: aparece el esqueleto mientras el servidor trae los
 * datos, en lugar de dejar la pantalla quieta unos segundos. Imita la forma del panel (menú y
 * tarjetas) para que el cambio no «salte».
 */
export default function PanelLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-12 w-24 rounded-full" />
        <Skeleton className="h-12 w-28 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
      <div className="mt-8" aria-hidden="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    </main>
  );
}
