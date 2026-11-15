import { FishLoader } from "@/components/brand/FishLoader";

/** Mientras una página trae datos, en vez de pantalla en blanco: los peces del logo. */
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <FishLoader label="Cargando la página" />
    </div>
  );
}
