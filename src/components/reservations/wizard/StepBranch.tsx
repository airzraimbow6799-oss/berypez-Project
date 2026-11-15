import { Check, MapPin, Minus, Phone, Plus } from "lucide-react";

import { BRANCHES, formatPhone } from "@/config/site";
import { MAX_PARTY } from "@/features/reservations/place-reservation";

import type { DraftUpdate, ReservationDraft } from "./types";

type Props = { draft: ReservationDraft; update: DraftUpdate };

/** Paso 1 · Sede (tarjetas grandes) y número de personas (botones − / + de 56 px). */
export function StepBranch({ draft, update }: Props) {
  const people = draft.partySize === 1 ? "1 persona" : `${draft.partySize} personas`;
  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-lg font-semibold">Elige la sede</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {BRANCHES.map((branch) => {
            const isSelected = draft.branchSlug === branch.slug;
            return (
              <label
                key={branch.slug}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-md border-2 p-5 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-foco)] ${
                  isSelected
                    ? "border-marino bg-aji-100"
                    : "border-borde bg-superficie hover:border-marino-600"
                }`}
              >
                <input
                  type="radio"
                  name="sede"
                  value={branch.slug}
                  checked={isSelected}
                  onChange={() => update("branchSlug", branch.slug)}
                  className="sr-only"
                />
                <span className="font-display text-2xl font-semibold">{branch.name}</span>
                {branch.address ? (
                  <span className="text-tinta-suave flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-4 shrink-0" />
                    {branch.address}
                  </span>
                ) : null}
                {branch.phone ? (
                  <span className="text-tinta-suave flex items-center gap-2 tabular-nums">
                    <Phone aria-hidden="true" className="size-4 shrink-0" />
                    {formatPhone(branch.phone)}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className={`absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-marino bg-marino text-crema" : "border-borde"
                  }`}
                >
                  {isSelected ? <Check className="size-5" /> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <p id="personas-label" className="text-lg font-semibold">
          ¿Cuántas personas vienen?
        </p>
        <div className="mt-3 flex items-center gap-4" role="group" aria-labelledby="personas-label">
          <button
            type="button"
            onClick={() => update("partySize", Math.max(1, draft.partySize - 1))}
            disabled={draft.partySize <= 1}
            aria-label="Una persona menos"
            className="border-marino text-marino hover:bg-crema-200 flex size-14 items-center justify-center rounded-full border-2 disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="size-6" />
          </button>
          <output
            aria-live="polite"
            className="font-display min-w-32 text-center text-2xl font-semibold whitespace-nowrap tabular-nums sm:min-w-40 sm:text-3xl"
          >
            {people}
          </output>
          <button
            type="button"
            onClick={() => update("partySize", Math.min(MAX_PARTY, draft.partySize + 1))}
            disabled={draft.partySize >= MAX_PARTY}
            aria-label="Una persona más"
            className="bg-marino text-crema hover:bg-marino-800 flex size-14 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="size-6" />
          </button>
        </div>
        <p className="text-tinta-suave mt-2">
          ¿Son más de {MAX_PARTY}? Llámanos a la sede y lo coordinamos.
        </p>
      </div>
    </div>
  );
}
