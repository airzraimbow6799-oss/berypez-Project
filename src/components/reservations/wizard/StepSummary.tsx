import type { ReactNode } from "react";

import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { BRANCHES, formatPhone } from "@/config/site";
import { formatLongDate, formatTime12 } from "@/features/reservations/wizard";

import type { ReservationDraft } from "./types";

type Props = {
  draft: ReservationDraft;
  onEdit: (step: number) => void;
  onToken: (token: string) => void;
  resetKey: number;
  tokenError?: string;
};

function Item({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-tinta-suave text-sm font-semibold">{label}</dt>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Cambiar ${label.toLowerCase()}`}
          className="text-marino-600 min-h-tactil -my-2 shrink-0 px-2 font-semibold underline underline-offset-4"
        >
          Cambiar
        </button>
      </div>
      <dd className="text-lg font-semibold">{children}</dd>
    </div>
  );
}

const AREA_LABEL = { "": "Me da igual", interior: "Adentro", terraza: "Terraza" } as const;

/** Paso 4 · Todo a la vista, con "Cambiar" en cada dato, y confirmación final. */
export function StepSummary({ draft, onEdit, onToken, resetKey, tokenError }: Props) {
  const branch = BRANCHES.find((b) => b.slug === draft.branchSlug);
  return (
    <div>
      <dl className="divide-borde border-borde bg-superficie divide-y rounded-md border px-5">
        <Item label="Sede" onEdit={() => onEdit(0)}>
          {branch?.name}
          {branch?.address ? (
            <span className="text-tinta-suave block text-base font-normal">{branch.address}</span>
          ) : null}
        </Item>
        <Item label="Personas" onEdit={() => onEdit(0)}>
          {draft.partySize === 1 ? "1 persona" : `${draft.partySize} personas`}
        </Item>
        <Item label="Día y hora" onEdit={() => onEdit(1)}>
          <span className="first-letter:uppercase">{formatLongDate(draft.date)}</span>, a las{" "}
          {formatTime12(draft.time)}
        </Item>
        <Item label="A nombre de" onEdit={() => onEdit(2)}>
          {draft.name.trim()}
          <span className="text-tinta-suave block text-base font-normal tabular-nums">
            Celular {formatPhone(draft.phone.replace(/\D/g, "").slice(-9))}
            {draft.email.trim() ? ` · ${draft.email.trim()}` : ""}
          </span>
        </Item>
        {draft.area || draft.occasion ? (
          <Item label="Preferencias" onEdit={() => onEdit(2)}>
            {[draft.area ? AREA_LABEL[draft.area] : "", draft.occasion].filter(Boolean).join(" · ")}
          </Item>
        ) : null}
      </dl>

      <div className="mt-6">
        <TurnstileWidget onToken={onToken} resetKey={resetKey} />
        {tokenError ? (
          <p role="alert" className="text-rocoto-texto mt-1 font-semibold">
            {tokenError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
