"use client";

import { useEffect, useState } from "react";

import { formatLongDate, formatTime12, groupSlots } from "@/features/reservations/wizard";

import { DateCalendar } from "./DateCalendar";
import type { DraftUpdate, ReservationDraft } from "./types";

type Slot = { time: string; available: boolean };
type Props = {
  draft: ReservationDraft;
  update: DraftUpdate;
  minIso: string;
  maxIso: string;
  error?: string;
};

/** Paso 2 · Día (calendario) y hora (agrupada por momento del día). */
export function StepDateTime({ draft, update, minIso, maxIso, error }: Props) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!draft.date) return;
    const controller = new AbortController();
    setSlots(null);
    setLoadError("");
    const query = new URLSearchParams({
      branch: draft.branchSlug,
      date: draft.date,
      party: String(draft.partySize),
    });
    fetch(`/api/reservations/availability?${query}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSlots(json.data.slots);
        else setLoadError(json.error.message);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoadError("No pudimos cargar los horarios.");
      });
    return () => controller.abort();
  }, [draft.branchSlug, draft.date, draft.partySize, attempt]);

  const groups = slots ? groupSlots(slots) : [];
  const hasFree = slots?.some((s) => s.available) ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <p className="mb-3 text-lg font-semibold">1. Elige el día</p>
        <DateCalendar
          value={draft.date}
          minIso={minIso}
          maxIso={maxIso}
          onChange={(iso) => update("date", iso)}
        />
      </div>

      <div>
        <p id="horas" className="mb-3 text-lg font-semibold">
          2. Elige la hora
          {draft.date ? (
            <span className="text-tinta-suave block text-base font-normal first-letter:uppercase">
              {formatLongDate(draft.date)}
            </span>
          ) : null}
        </p>
        <div aria-live="polite" aria-busy={Boolean(draft.date) && slots === null}>
          {!draft.date ? (
            <p className="bg-crema-200 rounded-md p-4 text-lg">
              Primero toca un día en el calendario y aquí verás las horas libres.
            </p>
          ) : loadError ? (
            <div role="alert" className="border-rocoto-texto rounded-md border p-4">
              <p className="text-rocoto-texto font-semibold">{loadError}</p>
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="text-marino-600 min-h-tactil font-semibold underline underline-offset-4"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : slots === null ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Buscando horarios">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-crema-200 h-14 animate-pulse rounded-md" />
              ))}
            </div>
          ) : !hasFree ? (
            <p className="bg-crema-200 rounded-md p-4 text-lg">
              Ese día ya no quedan mesas para {draft.partySize}{" "}
              {draft.partySize === 1 ? "persona" : "personas"}. Prueba con otro día o con la otra
              sede.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <fieldset key={group.id}>
                  <legend className="text-tinta-suave mb-2 text-sm font-bold tracking-wide uppercase">
                    {group.label}
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.slots.map((slot) => {
                      const isSelected = draft.time === slot.time;
                      return (
                        <label
                          key={slot.time}
                          className={`flex min-h-14 flex-col items-center justify-center rounded-md border-2 text-lg font-semibold tabular-nums has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)] ${
                            !slot.available
                              ? "border-borde text-tinta-suave cursor-not-allowed opacity-60"
                              : isSelected
                                ? "border-marino bg-marino text-crema cursor-pointer"
                                : "border-borde bg-superficie hover:border-marino-600 cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="hora"
                            className="sr-only"
                            disabled={!slot.available}
                            checked={isSelected}
                            onChange={() => update("time", slot.time)}
                          />
                          <span className={slot.available ? "" : "line-through"}>
                            {formatTime12(slot.time)}
                          </span>
                          {!slot.available ? (
                            <span className="text-xs font-semibold no-underline">Lleno</span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
        {error ? (
          <p role="alert" className="text-rocoto-texto mt-3 font-semibold">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
