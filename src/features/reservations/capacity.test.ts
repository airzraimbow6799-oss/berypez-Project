import { describe, expect, it } from "vitest";

import {
  checkSlot,
  countsAt,
  DEMO_CAPACITY,
  dateKeyLima,
  type SlotReservation,
  slotOf,
  slotsForDay,
  slotStart,
  slotTimes,
} from "./capacity";
import { fieldErrors, newReservationSchema } from "./staff-form";

// 21-nov-2026 10:00 en Lima (15:00 UTC): las franjas desde las 11:00 ya se pueden reservar.
const NOW = Date.parse("2026-11-21T15:00:00Z");
const DAY = "2026-11-21";

const res = (over: Partial<SlotReservation> & { time?: string } = {}): SlotReservation => {
  const { time = "20:00", ...rest } = over;
  return {
    startsAt: slotStart(DAY, time).toISOString(),
    partySize: 4,
    area: "interior",
    status: "confirmed",
    branch: "Lince",
    ...rest,
  };
};

describe("franjas", () => {
  it("van de 12:00 a 21:30 cada 30 minutos", () => {
    const times = slotTimes();
    expect(times[0]).toBe("12:00");
    expect(times.at(-1)).toBe("21:30");
    expect(times).toHaveLength(20);
  });

  it("una hora cae en la franja de 30 minutos que le corresponde (hora de Lima)", () => {
    expect(slotOf(slotStart(DAY, "19:00"))).toBe("19:00");
    expect(slotOf(new Date(slotStart(DAY, "19:00").getTime() + 29 * 60_000))).toBe("19:00");
    expect(slotOf(new Date(slotStart(DAY, "19:00").getTime() + 31 * 60_000))).toBe("19:30");
    expect(dateKeyLima(slotStart(DAY, "23:30"))).toBe(DAY);
  });
});

describe("countsAt", () => {
  it("suma personas y reservas de terraza de esa sede y franja", () => {
    const list = [
      res({ partySize: 4, area: "terraza" }),
      res({ partySize: 6 }),
      res({ partySize: 3, branch: "Jesús María" }),
      res({ partySize: 2, time: "20:30" }),
    ];
    expect(countsAt(list, "Lince", DAY, "20:00")).toEqual({
      seats: 10,
      parties: 2,
      terraceParties: 1,
    });
  });

  it("las canceladas y las que no llegaron liberan el cupo", () => {
    const list = [
      res({ status: "cancelled" }),
      res({ status: "no_show" }),
      res({ status: "arrived" }),
    ];
    expect(countsAt(list, "Lince", DAY, "20:00").parties).toBe(1);
  });
});

describe("checkSlot", () => {
  const q = {
    branch: "Lince",
    date: DAY,
    time: "20:00",
    partySize: 4,
    area: "interior" as const,
    now: NOW,
  };

  it("una franja libre se puede reservar", () => {
    expect(checkSlot([], q)).toEqual({ ok: true });
  });

  it("falta menos de una hora o ya pasó", () => {
    expect(checkSlot([], { ...q, time: "10:30" })).toEqual({ ok: false, reason: "past" });
    expect(checkSlot([], { ...q, time: "11:00" })).toEqual({ ok: true });
  });

  it("máximo 20 personas por reserva", () => {
    expect(checkSlot([], { ...q, partySize: 21 })).toEqual({ ok: false, reason: "too_big" });
    expect(checkSlot([], { ...q, partySize: 0 })).toEqual({ ok: false, reason: "too_big" });
  });

  it("no deja pasar el aforo de la franja", () => {
    const list = [res({ partySize: DEMO_CAPACITY.seatsPerSlot - 3 })];
    expect(checkSlot(list, { ...q, partySize: 3 })).toEqual({ ok: true });
    expect(checkSlot(list, { ...q, partySize: 4 })).toEqual({ ok: false, reason: "full" });
  });

  it("con la terraza llena a esa hora la terraza se bloquea, pero interior y «me da igual» siguen", () => {
    const list = [res({ area: "terraza" }), res({ area: "terraza", partySize: 2 })];
    expect(checkSlot(list, { ...q, area: "terraza" })).toEqual({
      ok: false,
      reason: "terrace_full",
    });
    expect(checkSlot(list, { ...q, area: "interior" })).toEqual({ ok: true });
    expect(checkSlot(list, { ...q, area: "cualquiera" })).toEqual({ ok: true });
  });

  it("una reserva de terraza cancelada vuelve a abrir la terraza", () => {
    const list = [res({ area: "terraza" }), res({ area: "terraza", status: "cancelled" })];
    expect(checkSlot(list, { ...q, area: "terraza" })).toEqual({ ok: true });
  });

  it("la misma regla vale para web y para el panel (no depende de quién reserva)", () => {
    const list = [res({ area: "terraza" }), res({ area: "terraza" })];
    expect(checkSlot(list, { ...q, area: "terraza" }).ok).toBe(false);
  });
});

describe("slotsForDay", () => {
  it("marca pasadas, libres, casi llenas y completas, y la terraza llena", () => {
    const list = [
      res({ time: "19:00", partySize: 32 }),
      res({ time: "20:00", partySize: 40 }),
      res({ time: "21:00", area: "terraza" }),
      res({ time: "21:00", area: "terraza" }),
    ];
    const byTime = Object.fromEntries(slotsForDay(list, "Lince", DAY, NOW).map((s) => [s.time, s]));
    expect(byTime["12:00"]?.state).toBe("libre");
    expect(byTime["19:00"]?.state).toBe("casi");
    expect(byTime["20:00"]?.state).toBe("completo");
    expect(byTime["21:00"]?.terraceFull).toBe(true);
    expect(byTime["21:00"]?.state).toBe("libre");
    const earlyNow = Date.parse("2026-11-21T20:00:00Z"); // 15:00 en Lima
    expect(slotsForDay([], "Lince", DAY, earlyNow).find((s) => s.time === "15:30")?.state).toBe(
      "pasado",
    );
  });
});

describe("newReservationSchema (reserva por llamada o WhatsApp)", () => {
  const valid = {
    branch: "Lince",
    date: DAY,
    time: "20:00",
    partySize: 4,
    area: "terraza",
    name: "Valeria Núñez",
    phone: "991736402",
    email: "",
    notes: "Aniversario",
    source: "phone",
  };

  it("acepta una reserva completa y el correo es opcional", () => {
    expect(newReservationSchema.safeParse(valid).success).toBe(true);
    expect(newReservationSchema.safeParse({ ...valid, email: "valeria@correo.pe" }).success).toBe(
      true,
    );
  });

  it("valida celular, correo, personas y origen", () => {
    const bad = newReservationSchema.safeParse({
      ...valid,
      phone: "12345",
      email: "no-es-correo",
      partySize: 25,
      source: "web",
      name: "A",
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(Object.keys(fieldErrors(bad.error)).sort()).toEqual([
        "email",
        "name",
        "partySize",
        "phone",
        "source",
      ]);
    }
  });
});
