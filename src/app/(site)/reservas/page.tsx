import type { Metadata } from "next";
import { Suspense } from "react";

import { FishLoader } from "@/components/brand/FishLoader";
import { ReservationWizard } from "@/components/reservations/wizard/ReservationWizard";

export const metadata: Metadata = {
  title: "Reservar",
  description: "Reserva tu mesa en Berypez Lince o Jesús María en 4 pasos sencillos.",
};

export default function ReservationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Reserva tu mesa</h1>
      <p className="text-tinta-suave mt-2 text-lg">
        Son 4 pasos cortos: sede, día y hora, tus datos y listo. Te confirmamos al instante.
      </p>
      <Suspense
        fallback={
          <FishLoader className="mt-10 flex justify-center" label="Cargando el formulario" />
        }
      >
        <ReservationWizard />
      </Suspense>
    </div>
  );
}
