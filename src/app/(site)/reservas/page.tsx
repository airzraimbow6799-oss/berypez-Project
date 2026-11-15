import type { Metadata } from "next";
import { Suspense } from "react";

import { FishLoader } from "@/components/brand/FishLoader";
import { ReservationForm } from "@/components/reservations/ReservationForm";

export const metadata: Metadata = {
  title: "Reservar mesa",
  description: "Reserva tu mesa en Berypez Lince o Jesús María en un solo paso.",
};

export default function ReservationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Reserva tu mesa</h1>
      <p className="text-tinta-suave mt-2 text-lg">
        Elige sede, día y hora. Te confirmamos al instante.
      </p>
      <Suspense
        fallback={
          <FishLoader className="mt-10 flex justify-center" label="Cargando el formulario" />
        }
      >
        <ReservationForm />
      </Suspense>
    </div>
  );
}
