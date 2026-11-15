import type { Metadata } from "next";

import { FISH_VIEWBOX, FishPaths } from "@/components/brand/logo-paths";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Página no encontrada" };

/** 404 en español, con salidas claras a lo que la persona probablemente buscaba. */
export default function NotFound() {
  return (
    <main className="bg-fondo text-tinta flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <svg
        viewBox={FISH_VIEWBOX}
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
        className="text-marino h-16 w-auto"
      >
        <FishPaths />
      </svg>
      <h1 className="mt-6 text-4xl font-semibold">No encontramos esta página</h1>
      <p className="text-tinta-suave mt-3 max-w-md text-lg">
        Puede que el enlace esté mal escrito o que la página ya no exista. Te dejamos por dónde
        seguir:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" size="lg">
          Ir al inicio
        </Button>
        <Button href="/carta/marina" variant="secundario" size="lg">
          Ver la carta
        </Button>
        <Button href="/reservas" variant="secundario" size="lg">
          Reservar
        </Button>
      </div>
    </main>
  );
}
