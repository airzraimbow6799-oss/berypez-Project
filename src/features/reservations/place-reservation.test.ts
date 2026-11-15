import { describe, expect, it, vi } from "vitest";

import { placeReservation, type ReservationDeps } from "./place-reservation";

const HOURS = [{ day: 5, open: "11:00", close: "17:00" }];
const NOW = new Date("2026-11-19T12:00:00-05:00");

function deps(overrides: Partial<ReservationDeps> = {}): ReservationDeps {
  return {
    verifyTurnstile: vi.fn(async () => true),
    hitRateLimit: vi.fn(async () => true),
    getBranch: vi.fn(async () => ({
      id: 1,
      slug: "lince",
      name: "Lince",
      whatsapp: null,
      openingHours: HOURS,
      capacity: 10,
    })),
    getReservedSeats: vi.fn(async () => new Map<string, number>()),
    isBlocked: vi.fn(async () => false),
    createReservation: vi.fn(async () => ({ reservationId: 3, manageToken: "tok" })),
    ...overrides,
  };
}

const body = (extra: Record<string, unknown> = {}) => ({
  branchSlug: "lince",
  date: "2026-11-20",
  time: "13:00",
  partySize: 4,
  area: "terraza",
  occasion: "Cumpleaños",
  name: "Rosa",
  phone: "987654321",
  email: "",
  acceptPrivacy: true,
  turnstileToken: "x",
  ...extra,
});

describe("placeReservation", () => {
  it("crea la reserva con la hora de Lima calculada en el servidor", async () => {
    const d = deps();
    const result = await placeReservation(body(), { ip: "1.1.1.1", now: NOW }, d);
    expect(result.status).toBe(201);
    expect(vi.mocked(d.createReservation).mock.calls[0]?.[0]).toMatchObject({
      branch_id: 1,
      starts_at: "2026-11-20T13:00:00-05:00",
      party_size: 4,
      area: "terraza",
    });
  });

  it("409 si la franja no tiene cupo para el grupo", async () => {
    const reserved = new Map([["2026-11-20T13:00:00-05:00", 8]]);
    const result = await placeReservation(
      body(),
      { ip: null, now: NOW },
      deps({ getReservedSeats: vi.fn(async () => reserved) }),
    );
    expect(result.status).toBe(409);
  });

  it("rechaza horas fuera de las franjas (por ejemplo, 16:30 cuando cierra a las 17:00)", async () => {
    const result = await placeReservation(body({ time: "16:30" }), { ip: null, now: NOW }, deps());
    expect(result.body).toMatchObject({ error: { fields: { time: expect.any(String) } } });
  });

  it("fecha bloqueada: sin franjas", async () => {
    const result = await placeReservation(
      body(),
      { ip: null, now: NOW },
      deps({ isBlocked: vi.fn(async () => true) }),
    );
    expect(result.status).toBe(400);
  });

  it("valida grupo, celular y privacidad", async () => {
    const result = await placeReservation(
      body({ partySize: 30, phone: "1", acceptPrivacy: false }),
      { ip: null, now: NOW },
      deps(),
    );
    expect(Object.keys((result.body as { error: { fields: object } }).error.fields)).toEqual(
      expect.arrayContaining(["partySize", "phone", "acceptPrivacy"]),
    );
  });

  it("429 por límite y 403 por antibots", async () => {
    expect(
      (
        await placeReservation(
          body(),
          { ip: null, now: NOW },
          deps({ hitRateLimit: vi.fn(async () => false) }),
        )
      ).status,
    ).toBe(429);
    expect(
      (
        await placeReservation(
          body(),
          { ip: null, now: NOW },
          deps({ verifyTurnstile: vi.fn(async () => false) }),
        )
      ).status,
    ).toBe(403);
  });

  it("si la base detecta sobreventa simultánea, responde 409 y no 500", async () => {
    const result = await placeReservation(
      body(),
      { ip: null, now: NOW },
      deps({
        createReservation: vi.fn(async () => Promise.reject(new Error("Sin cupo en esa franja"))),
      }),
    );
    expect(result.status).toBe(409);
  });

  it("500 sin detalles técnicos ante otros errores", async () => {
    const result = await placeReservation(
      body(),
      { ip: null, now: NOW },
      deps({ createReservation: vi.fn(async () => Promise.reject(new Error("pg boom"))) }),
    );
    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain("boom");
  });
});
