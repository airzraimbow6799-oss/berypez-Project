"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  formatLongDate,
  formatMonth,
  monthGrid,
  monthHasDays,
  monthOf,
  WEEKDAY_SHORT,
} from "@/features/reservations/wizard";

type Props = {
  value: string;
  minIso: string;
  maxIso: string;
  onChange: (iso: string) => void;
};

function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: index % 12 };
}

/** Calendario mensual con días grandes. Días fuera del rango se ven, pero no se eligen. */
export function DateCalendar({ value, minIso, maxIso, onChange }: Props) {
  const [view, setView] = useState(() => monthOf(value || minIso));
  const prev = shiftMonth(view.year, view.month, -1);
  const next = shiftMonth(view.year, view.month, 1);
  const canPrev = monthHasDays(prev.year, prev.month, minIso, maxIso);
  const canNext = monthHasDays(next.year, next.month, minIso, maxIso);
  const title = formatMonth(view.year, view.month);

  return (
    <div className="border-borde bg-superficie rounded-md border p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(prev)}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="hover:bg-crema-200 flex size-12 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <p aria-live="polite" className="text-lg font-semibold capitalize">
          {title}
        </p>
        <button
          type="button"
          onClick={() => setView(next)}
          disabled={!canNext}
          aria-label="Mes siguiente"
          className="hover:bg-crema-200 flex size-12 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronRight aria-hidden="true" className="size-6" />
        </button>
      </div>

      <table className="mt-2 w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">Elige el día de tu reserva, {title}</caption>
        <thead>
          <tr>
            {WEEKDAY_SHORT.map((day) => (
              <th key={day} scope="col" className="text-tinta-suave pb-1 text-sm font-semibold">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(view.year, view.month, minIso, maxIso).map((week, w) => (
            <tr key={w}>
              {week.map((day, d) => (
                <td key={d} className="p-0">
                  {day ? (
                    <button
                      type="button"
                      disabled={!day.isSelectable}
                      onClick={() => onChange(day.iso)}
                      aria-pressed={value === day.iso}
                      aria-label={formatLongDate(day.iso)}
                      className={`flex aspect-square min-h-11 w-full items-center justify-center rounded-md text-lg font-semibold tabular-nums transition-colors ${
                        value === day.iso
                          ? "bg-marino text-crema"
                          : day.isSelectable
                            ? "text-tinta hover:bg-aji-100 border-borde border"
                            : "text-tinta-suave/50 cursor-not-allowed"
                      }`}
                    >
                      {day.day}
                    </button>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
