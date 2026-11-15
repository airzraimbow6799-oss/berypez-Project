import { cx } from "./cx";

/** Marcador de carga. Decorativo: el estado “cargando” se anuncia en el contenedor (aria-busy). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("bg-crema-200 animate-pulse rounded-sm motion-reduce:animate-none", className)}
    />
  );
}
