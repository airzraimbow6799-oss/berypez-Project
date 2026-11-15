import { describe, expect, it } from "vitest";

import { branchStatus, isWithinHours, type OpeningHours, parseOpeningHours } from "./hours";

// Lima es UTC−5 todo el año. 2026-11-16 es lunes.
const lima = (iso: string) => new Date(`${iso}-05:00`);

const LUNCH: OpeningHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "11:00",
  close: "17:00",
}));
const CLOSED_MONDAY: OpeningHours = LUNCH.filter((slot) => slot.day !== 1);

describe("isWithinHours", () => {
  it("abierto dentro del horario y cerrado fuera (hora de Lima)", () => {
    expect(isWithinHours(LUNCH, lima("2026-11-16T12:30:00"))).toBe(true);
    expect(isWithinHours(LUNCH, lima("2026-11-16T10:59:00"))).toBe(false);
    expect(isWithinHours(LUNCH, lima("2026-11-16T17:00:00"))).toBe(false);
  });

  it("usa la hora de Lima aunque el servidor esté en UTC", () => {
    // 16:30 UTC = 11:30 en Lima.
    expect(isWithinHours(LUNCH, new Date("2026-11-16T16:30:00Z"))).toBe(true);
  });

  it("respeta los días sin atención", () => {
    expect(isWithinHours(CLOSED_MONDAY, lima("2026-11-16T12:00:00"))).toBe(false);
  });
});

describe("branchStatus", () => {
  it("abierto: dice a qué hora cierra", () => {
    expect(branchStatus(LUNCH, lima("2026-11-16T12:00:00"))).toEqual({
      isOpen: true,
      label: "Abierto · cierra a las 17:00",
    });
  });

  it("cerrado antes de abrir: dice a qué hora abre hoy", () => {
    expect(branchStatus(LUNCH, lima("2026-11-16T08:00:00"))).toEqual({
      isOpen: false,
      label: "Cerrado · abre hoy a las 11:00",
    });
  });

  it("cerrado después del cierre: busca el próximo día", () => {
    expect(branchStatus(CLOSED_MONDAY, lima("2026-11-15T18:00:00"))).toEqual({
      isOpen: false,
      label: "Cerrado · abre el martes a las 11:00",
    });
  });

  it("sin horario cargado", () => {
    expect(branchStatus([], lima("2026-11-16T12:00:00"))).toEqual({
      isOpen: false,
      label: "Horario por confirmar",
    });
  });
});

describe("parseOpeningHours", () => {
  it("valida el JSON de la base y descarta tramos inválidos", () => {
    expect(
      parseOpeningHours([
        { day: 1, open: "11:00", close: "17:00" },
        { day: 9, open: "x", close: "y" },
      ]),
    ).toEqual([{ day: 1, open: "11:00", close: "17:00" }]);
    expect(parseOpeningHours("basura")).toEqual([]);
  });
});
