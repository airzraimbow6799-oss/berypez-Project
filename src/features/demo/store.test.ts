// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import { dateKeyLima } from "@/features/reservations/capacity";

import { useDemoStore } from "./store";

/** Generador repetible para que la prueba no dependa del azar. */
const seeded = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

const state = () => useDemoStore.getState();

beforeEach(() => state().reset());

describe("datos de ejemplo", () => {
  it("empieza listo y reiniciar borra los avisos y vuelve a los datos de partida", () => {
    expect(state().isReady).toBe(true);
    const before = state().orders.length;
    state().simulateOrder(seeded(0.2));
    expect(state().orders.length).toBe(before + 1);
    state().reset();
    expect(state().orders.length).toBe(before);
    expect(state().notifications).toHaveLength(0);
  });
});

describe("avisos de pedidos", () => {
  it("un pedido simulado entra primero, como recibido, y avisa", () => {
    const alert = state().simulateOrder(seeded(0.1, 0.9, 0.3));
    const first = state().orders[0];
    expect(first?.status).toBe("received");
    expect(first?.totalCents).toBeGreaterThan(0);
    expect(alert.kind).toBe("order");
    expect(alert.title).toContain(String(first?.id));
    expect(state().notifications[0]).toMatchObject({ id: alert.id, isRead: false });
  });

  it("nunca arma un pedido con un plato agotado", () => {
    for (let i = 0; i < 25; i += 1) {
      state().simulateOrder(seeded(i / 25, ((i * 7) % 25) / 25, 0.4));
    }
    const soldOut = new Set(
      state()
        .dishes.filter((d) => !d.isAvailable)
        .map((d) => d.name),
    );
    const names = state()
      .orders.filter((o) => o.id > 1041)
      .flatMap((o) => o.items.map((i) => i.name));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(soldOut.has(name)).toBe(false);
  });

  it("marcar todo como leído apaga los avisos nuevos", () => {
    state().simulateOrder(seeded(0.5));
    state().simulateOrder(seeded(0.6));
    expect(state().notifications.every((n) => !n.isRead)).toBe(true);
    state().markAllRead();
    expect(state().notifications.every((n) => n.isRead)).toBe(true);
  });
});

describe("reservas", () => {
  it("una reserva simulada de la web entra con su origen y avisa", () => {
    const before = state().reservations.length;
    const alert = state().simulateReservation(seeded(0.3, 0.8, 0.5, 0.4, 0.2, 0.6));
    expect(alert?.kind).toBe("reservation");
    expect(state().reservations).toHaveLength(before + 1);
    const created = state().reservations.find((r) => r.source === "web" && r.id > 315);
    expect(created?.status).toBe("confirmed");
  });

  it("agregar una reserva la deja ordenada por hora y con un número nuevo", () => {
    const early = state().addReservation({
      startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      partySize: 2,
      area: null,
      occasion: null,
      name: "Prueba",
      phone: "999888777",
      status: "confirmed",
      branch: "Lince",
      source: "phone",
    });
    const ids = state().reservations.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(early.id).toBeGreaterThan(315);
    const times = state().reservations.map((r) => Date.parse(r.startsAt));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(dateKeyLima(early.startsAt)).not.toBe(dateKeyLima(Date.now()));
  });
});

describe("personal", () => {
  it("invitar agrega a la persona como pendiente y con el correo en minúsculas", () => {
    const member = state().inviteMember({
      name: "Nueva Persona",
      email: "NUEVA@Demo.Berypez.pe",
      role: "salon",
      branch: "Lince",
    });
    expect(member).toMatchObject({
      email: "nueva@demo.berypez.pe",
      isPending: true,
      isActive: true,
    });
    expect(state().staff.at(-1)?.id).toBe(member.id);
  });

  it("no deja desactivar ni bajar de rol a la única administración activa", () => {
    const admin = state().staff.find((m) => m.role === "admin");
    expect(state().setMemberActive(admin!.id, false).ok).toBe(false);
    expect(state().setMemberRole(admin!.id, "salon").ok).toBe(false);
    expect(state().staff.find((m) => m.id === admin!.id)).toMatchObject({
      role: "admin",
      isActive: true,
    });
  });

  it("con una segunda administración sí se puede, y desactivar no borra a la persona", () => {
    const recepcion = state().staff.find((m) => m.role === "salon" && m.isActive)!;
    expect(state().setMemberRole(recepcion.id, "admin").ok).toBe(true);
    const admin = state().staff.find((m) => m.email === "admin@demo.berypez.pe")!;
    expect(state().setMemberActive(admin.id, false).ok).toBe(true);
    expect(state().staff.find((m) => m.id === admin.id)?.isActive).toBe(false);
  });
});
