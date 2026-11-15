import { CalendarDays, Clock, MapPin, User, Users } from "lucide-react";
import type { ReactNode } from "react";

import { BRANCHES } from "@/config/site";
import { formatLongDate, formatTime12 } from "@/features/reservations/wizard";

import type { ReservationDraft } from "./types";

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-marino-600 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">{label}</dt>
        <dd className={value ? "text-tinta font-semibold" : "text-tinta-suave italic"}>
          {value ?? "Por elegir"}
        </dd>
      </div>
    </div>
  );
}

/**
 * El "ticket" de la reserva: se llena a medida que la persona responde, con borde
 * troquelado como una comanda. En el celular se muestra compacto, arriba del paso.
 */
export function ReservationTicket({
  draft,
  hasDate,
}: {
  draft: ReservationDraft;
  hasDate: boolean;
}) {
  const branch = BRANCHES.find((b) => b.slug === draft.branchSlug);
  const people = draft.partySize === 1 ? "1 persona" : `${draft.partySize} personas`;
  return (
    <aside
      aria-label="Tu reserva hasta ahora"
      className="ticket bg-aji-100 text-tinta rounded-md px-5 pt-5 pb-7 shadow-sm"
    >
      <p className="font-display text-xl font-semibold">Tu reserva</p>
      <dl className="divide-borde mt-2 divide-y divide-dashed">
        <Row
          icon={<MapPin aria-hidden="true" className="size-5" />}
          label="Sede"
          value={branch ? `${branch.name}${branch.address ? ` · ${branch.address}` : ""}` : null}
        />
        <Row
          icon={<Users aria-hidden="true" className="size-5" />}
          label="Personas"
          value={people}
        />
        <Row
          icon={<CalendarDays aria-hidden="true" className="size-5" />}
          label="Día"
          value={hasDate ? formatLongDate(draft.date) : null}
        />
        <Row
          icon={<Clock aria-hidden="true" className="size-5" />}
          label="Hora"
          value={draft.time ? formatTime12(draft.time) : null}
        />
        <Row
          icon={<User aria-hidden="true" className="size-5" />}
          label="A nombre de"
          value={draft.name.trim() || null}
        />
      </dl>
    </aside>
  );
}
