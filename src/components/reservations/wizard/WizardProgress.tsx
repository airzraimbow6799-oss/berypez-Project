import { Check } from "lucide-react";

import { WIZARD_STEPS } from "@/features/reservations/wizard";

type Props = {
  current: number;
  /** Último paso al que se puede volver (los ya completados). */
  furthest: number;
  onGoTo: (index: number) => void;
};

/** Progreso de la reserva: "Paso 2 de 4" siempre visible; los pasos hechos se pueden reabrir. */
export function WizardProgress({ current, furthest, onGoTo }: Props) {
  const step = WIZARD_STEPS[current];
  return (
    <nav aria-label="Pasos de la reserva">
      <p className="text-tinta-suave text-base font-semibold sm:hidden">
        Paso {current + 1} de {WIZARD_STEPS.length}:{" "}
        <span className="text-tinta">{step?.label}</span>
      </p>
      <div className="mt-2 flex gap-1.5 sm:hidden" aria-hidden="true">
        {WIZARD_STEPS.map((s, index) => (
          <span
            key={s.id}
            className={`h-2 flex-1 rounded-full ${index <= current ? "bg-marino" : "bg-crema-200"}`}
          />
        ))}
      </div>

      <ol className="hidden items-center gap-2 sm:flex">
        {WIZARD_STEPS.map((s, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const canOpen = index <= furthest && !isCurrent;
          const content = (
            <>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold tabular-nums ${
                  isCurrent
                    ? "border-marino bg-marino text-crema"
                    : isDone
                      ? "border-limon-texto bg-limon-texto text-crema"
                      : "border-borde text-tinta-suave"
                }`}
              >
                {isDone ? <Check aria-hidden="true" className="size-5" /> : index + 1}
              </span>
              <span
                className={isCurrent ? "text-tinta font-bold" : "text-tinta-suave font-semibold"}
              >
                {s.label}
              </span>
              {isDone ? <span className="sr-only">(listo)</span> : null}
            </>
          );
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2 last:flex-none">
              {canOpen ? (
                <button
                  type="button"
                  onClick={() => onGoTo(index)}
                  className="min-h-tactil flex items-center gap-2 rounded-md px-1 hover:underline"
                >
                  {content}
                </button>
              ) : (
                <span
                  className="min-h-tactil flex items-center gap-2 px-1"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {content}
                </span>
              )}
              {index < WIZARD_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${index < current ? "bg-limon-texto" : "bg-borde"}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
