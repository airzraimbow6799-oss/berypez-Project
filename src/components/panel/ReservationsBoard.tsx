"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { SOURCE_LABELS } from "@/features/reservations/staff-form";

export type PanelReservation = {
  id: number;
  startsAt: string;
  partySize: number;
  area: string | null;
  occasion: string | null;
  name: string;
  phone: string;
  status: "confirmed" | "arrived" | "no_show" | "cancelled";
  branch: string;
  /** Por dónde entró: web, llamada o WhatsApp (si se conoce). */
  source?: "web" | "phone" | "whatsapp";
  notes?: string | null;
  email?: string | null;
};

const LABELS = {
  confirmed: "Confirmada",
  arrived: "Llegó",
  no_show: "No vino",
  cancelled: "Cancelada",
} as const;

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  }).format(new Date(iso));

/** F4-06 · Lista de reservas por día con cambio de estado (llegó / no vino / cancelar). */
export function ReservationsBoard({
  reservations,
  onStatusChange,
}: {
  reservations: PanelReservation[];
  /** Modo demostración: cambia el estado en los datos de ejemplo, sin llamar a la API. */
  onStatusChange?: (id: number, status: PanelReservation["status"]) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  const update = async (id: number, status: PanelReservation["status"]) => {
    if (onStatusChange) {
      onStatusChange(id, status);
      return;
    }
    setBusy(id);
    const res = await fetch(`/api/admin/reservations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error("No se pudo actualizar la reserva.");
      return;
    }
    router.refresh();
  };

  if (reservations.length === 0) {
    return (
      <p className="text-tinta-suave mt-10 text-center text-lg">
        No hay reservas para los próximos 7 días.
      </p>
    );
  }

  const groups = reservations.reduce<Map<string, PanelReservation[]>>((map, r) => {
    const key = dayKey(r.startsAt);
    return new Map(map).set(key, [...(map.get(key) ?? []), r]);
  }, new Map());

  return (
    <div className="mt-6 flex flex-col gap-8">
      {[...groups.entries()].map(([day, list]) => (
        <section key={day} aria-label={day}>
          <h2 className="text-xl font-semibold first-letter:uppercase">
            {day} ·{" "}
            {list.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.partySize, 0)}{" "}
            personas
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((r) => (
              <li
                key={r.id}
                className={`bg-superficie border-borde rounded-md border p-4 shadow-sm ${r.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold tabular-nums">
                    {new Date(r.startsAt).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Lima",
                    })}{" "}
                    · {r.name}
                  </p>
                  <span className="bg-aji-100 rounded-pill px-3 py-1 text-sm font-semibold">
                    {LABELS[r.status]}
                  </span>
                </div>
                <p className="text-tinta-suave text-sm">
                  {r.partySize} personas · {r.branch}
                  {r.area ? ` · ${r.area}` : ""}
                  {r.occasion ? ` · ${r.occasion}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:+51${r.phone}`}
                    className="min-h-tactil -my-2 inline-flex items-center text-sm underline underline-offset-4"
                  >
                    {r.phone}
                  </a>
                  {r.source ? <Badge>{SOURCE_LABELS[r.source]}</Badge> : null}
                </div>
                {r.status === "confirmed" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button isLoading={busy === r.id} onClick={() => update(r.id, "arrived")}>
                      Llegó
                    </Button>
                    <Button
                      variant="secundario"
                      isLoading={busy === r.id}
                      onClick={() => update(r.id, "no_show")}
                    >
                      No vino
                    </Button>
                    <Button
                      variant="fantasma"
                      isLoading={busy === r.id}
                      onClick={() => update(r.id, "cancelled")}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
