import { describe, expect, it } from "vitest";

import { buildSlots, limaDayRange, toLimaIso } from "./availability";

const HOURS = [{ day: 5, open: "11:00", close: "14:00" }]; // viernes
const FRIDAY = "2026-11-20";

describe("buildSlots", () => {
  it("genera franjas de 30 min hasta una hora antes del cierre", () => {
    const slots = buildSlots({
      date: FRIDAY,
      hours: HOURS,
      capacity: 10,
      reserved: new Map(),
      partySize: 2,
      now: new Date("2026-11-19T12:00:00-05:00"),
    });
    expect(slots.map((s) => s.time)).toEqual(["11:00", "11:30", "12:00", "12:30", "13:00"]);
    expect(slots[0]).toMatchObject({
      startsAt: "2026-11-20T11:00:00-05:00",
      available: true,
      seatsLeft: 10,
    });
  });

  it("marca sin cupo cuando la mesa no entra", () => {
    const reserved = new Map([["2026-11-20T12:00:00-05:00", 9]]);
    const slots = buildSlots({
      date: FRIDAY,
      hours: HOURS,
      capacity: 10,
      reserved,
      partySize: 2,
      now: new Date("2026-11-19T12:00:00-05:00"),
    });
    expect(slots.find((s) => s.time === "12:00")).toMatchObject({ available: false, seatsLeft: 1 });
  });

  it("no ofrece franjas pasadas ni con menos de 1 hora de anticipación", () => {
    const slots = buildSlots({
      date: FRIDAY,
      hours: HOURS,
      capacity: 10,
      reserved: new Map(),
      partySize: 2,
      now: new Date("2026-11-20T11:10:00-05:00"),
    });
    expect(slots.filter((s) => s.available).map((s) => s.time)).toEqual(["12:30", "13:00"]);
  });

  it("día sin atención o bloqueado: sin franjas", () => {
    expect(
      buildSlots({
        date: "2026-11-21",
        hours: HOURS,
        capacity: 10,
        reserved: new Map(),
        partySize: 2,
        now: new Date("2026-11-19T12:00:00-05:00"),
      }),
    ).toEqual([]);
    expect(
      buildSlots({
        date: FRIDAY,
        hours: HOURS,
        capacity: 10,
        reserved: new Map(),
        partySize: 2,
        now: new Date("2026-11-19T12:00:00-05:00"),
        isBlocked: true,
      }),
    ).toEqual([]);
  });
});

describe("toLimaIso", () => {
  it("convierte el formato de Postgres a la hora de Lima", () => {
    expect(toLimaIso("2026-11-20 18:00:00+00")).toBe("2026-11-20T13:00:00-05:00");
    expect(toLimaIso(new Date("2026-11-20T13:30:00-05:00"))).toBe("2026-11-20T13:30:00-05:00");
  });
});

describe("limaDayRange", () => {
  it("devuelve el inicio y fin del día en Lima", () => {
    expect(limaDayRange(FRIDAY)).toEqual({
      from: "2026-11-20T00:00:00-05:00",
      to: "2026-11-21T00:00:00-05:00",
    });
  });
});
