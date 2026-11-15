import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CancelReservationButton } from "@/components/reservations/CancelReservationButton";
import { Button } from "@/components/ui/Button";
import { getReservationByToken } from "@/features/reservations/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu reserva", robots: { index: false, follow: false } };

const AREA = { interior: "Interior", terraza: "Terraza" } as const;

/** F4-03 / F4-05 · Confirmación de la reserva con enlace para cancelar. */
export default async function ReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const token = z.uuid().safeParse((await params).token);
  if (!token.success) notFound();
  const reservation = await getReservationByToken(token.data);
  if (!reservation) notFound();

  const branchRef = reservation.branches as unknown as
    { name: string } | Array<{ name: string }> | null;
  const branch = (Array.isArray(branchRef) ? branchRef[0]?.name : branchRef?.name) ?? "";
  const when = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(reservation.starts_at));
  const isCancelled = reservation.status === "cancelled";

  return (
    <div className="mx-auto max-w-xl px-4 pt-10 pb-16 text-center">
      <CalendarCheck
        aria-hidden="true"
        className={`mx-auto size-16 ${isCancelled ? "text-tinta-suave" : "text-limon-texto"}`}
      />
      <h1 className="mt-3 text-4xl font-semibold">
        {isCancelled ? "Reserva cancelada" : "¡Reserva confirmada!"}
      </h1>
      <dl className="border-borde bg-superficie mt-6 grid gap-2 rounded-md border p-5 text-left shadow-sm">
        <div>
          <dt className="text-tinta-suave text-sm">Sede</dt>
          <dd className="font-semibold">{branch}</dd>
        </div>
        <div>
          <dt className="text-tinta-suave text-sm">Cuándo</dt>
          <dd className="font-semibold first-letter:uppercase">{when}</dd>
        </div>
        <div>
          <dt className="text-tinta-suave text-sm">Personas</dt>
          <dd className="font-semibold">{reservation.party_size}</dd>
        </div>
        {reservation.area ? (
          <div>
            <dt className="text-tinta-suave text-sm">Zona</dt>
            <dd className="font-semibold">
              {AREA[reservation.area as keyof typeof AREA] ?? reservation.area}
            </dd>
          </div>
        ) : null}
        {reservation.occasion ? (
          <div>
            <dt className="text-tinta-suave text-sm">Ocasión</dt>
            <dd className="font-semibold">{reservation.occasion}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-tinta-suave text-sm">A nombre de</dt>
          <dd className="font-semibold">{reservation.customer_name}</dd>
        </div>
      </dl>
      {!isCancelled ? (
        <>
          <p className="text-tinta-suave mt-4 text-sm">
            Guarda este enlace: con él puedes cancelar tu reserva. Te esperamos hasta 15 minutos
            después de la hora.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <CancelReservationButton token={token.data} />
            <Button href="/carta/marina" variant="fantasma">
              Ver la carta
            </Button>
          </div>
        </>
      ) : (
        <Button href="/reservas" className="mt-6">
          Hacer otra reserva
        </Button>
      )}
    </div>
  );
}
