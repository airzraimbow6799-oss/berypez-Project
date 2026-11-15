import { describe, expect, it } from "vitest";

import {
  addDays,
  formatLongDate,
  formatMonth,
  formatTime12,
  groupSlots,
  monthGrid,
  monthHasDays,
  monthOf,
  stepForField,
} from "./wizard";

describe("formatos", () => {
  it("fecha larga en español", () => {
    expect(formatLongDate("2026-11-21")).toBe("sábado 21 de noviembre");
    expect(formatLongDate("2026-11-15")).toBe("domingo 15 de noviembre");
  });

  it("mes y año", () => {
    expect(formatMonth(2026, 10)).toBe("noviembre 2026");
  });

  it("hora en formato de 12 horas", () => {
    expect(formatTime12("11:30")).toBe("11:30 a. m.");
    expect(formatTime12("12:00")).toBe("12:00 p. m.");
    expect(formatTime12("13:30")).toBe("1:30 p. m.");
    expect(formatTime12("00:15")).toBe("12:15 a. m.");
  });

  it("suma días cruzando meses", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 60)).toBe("2027-03-01");
  });
});

describe("monthGrid", () => {
  it("noviembre 2026 empieza en domingo: 6 huecos antes (semana de lunes a domingo)", () => {
    const weeks = monthGrid(2026, 10, "2026-11-15", "2027-01-14");
    expect(weeks[0]?.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(weeks[0]?.[6]?.day).toBe(1);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it("solo se pueden elegir los días del rango", () => {
    const days = monthGrid(2026, 10, "2026-11-15", "2026-11-20")
      .flat()
      .filter((d) => d !== null);
    expect(days.filter((d) => d.isSelectable).map((d) => d.day)).toEqual([15, 16, 17, 18, 19, 20]);
  });

  it("sabe si un mes tiene días elegibles", () => {
    expect(monthHasDays(2026, 10, "2026-11-15", "2027-01-14")).toBe(true);
    expect(monthHasDays(2026, 9, "2026-11-15", "2027-01-14")).toBe(false);
    expect(monthHasDays(2027, 1, "2026-11-15", "2027-01-14")).toBe(false);
    expect(monthOf("2027-01-14")).toEqual({ year: 2027, month: 0 });
  });
});

describe("groupSlots", () => {
  it("agrupa en almuerzo, tarde y noche y omite grupos vacíos", () => {
    const groups = groupSlots([
      { time: "12:00", available: true },
      { time: "14:30", available: false },
      { time: "15:00", available: true },
      { time: "16:30", available: true },
    ]);
    expect(groups.map((g) => [g.label, g.slots.map((s) => s.time)])).toEqual([
      ["Almuerzo", ["12:00", "14:30"]],
      ["Tarde", ["15:00", "16:30"]],
    ]);
  });
});

describe("stepForField", () => {
  it("lleva al paso donde se corrige cada campo", () => {
    expect(stepForField("time")).toBe("fecha");
    expect(stepForField("partySize")).toBe("sede");
    expect(stepForField("phone")).toBe("datos");
    expect(stepForField("turnstileToken")).toBe("resumen");
  });
});
