"use client";

import { create } from "zustand";

import type { PanelReservation } from "@/components/panel/ReservationsBoard";
import { isSoldOut } from "@/features/carta/logic";
import type { Dish, DishFormOutput } from "@/features/carta/schema";
import type { PanelOrder } from "@/features/orders/panel";
import { canTransition, type OrderStatus } from "@/features/orders/status";
import { checkSlot, dateKeyLima, slotStart, slotTimes } from "@/features/reservations/capacity";
import { SOURCE_LABELS } from "@/features/reservations/staff-form";
import { canChange, type ChangeResult, type Invite, type Member } from "@/features/staff/members";
import { createDemoData, type DemoData } from "./seed";

/**
 * Datos de ejemplo del panel en el navegador (modo demostración).
 * Viven en memoria: al recargar la página vuelven a los datos de partida.
 * El estado inicial se crea al montar (`reset`), no al importar el módulo, para que el
 * servidor y el navegador no generen horas distintas.
 */

export type DemoNotification = {
  id: number;
  kind: "order" | "reservation";
  title: string;
  detail: string;
  at: string;
  isRead: boolean;
};

type DemoState = DemoData & {
  isReady: boolean;
  notifications: DemoNotification[];
  reset: () => void;
  ensureReady: () => void;

  setDishPrice: (id: number, priceCents: number) => void;
  setDishAvailable: (id: number, isAvailable: boolean) => void;
  addDish: (data: DishFormOutput) => Dish;
  updateDish: (id: number, data: DishFormOutput) => void;
  removeDish: (id: number) => void;

  advanceOrder: (id: number, status: OrderStatus) => void;
  setReservationStatus: (id: number, status: PanelReservation["status"]) => void;
  addReservation: (reservation: Omit<PanelReservation, "id">) => PanelReservation;

  inviteMember: (invite: Invite) => Member;
  setMemberRole: (id: number, role: Member["role"]) => ChangeResult;
  setMemberActive: (id: number, isActive: boolean) => ChangeResult;

  /** Simula la llegada de un pedido nuevo (lo que haría el cliente desde la web). */
  simulateOrder: (random?: () => number) => DemoNotification;
  /** Simula una reserva nueva hecha por un cliente desde la web. Null si no hay cupo. */
  simulateReservation: (random?: () => number) => DemoNotification | null;
  markAllRead: () => void;
};

const mapDish = (dishes: Dish[], id: number, change: (dish: Dish) => Dish) =>
  dishes.map((dish) => (dish.id === id ? change(dish) : dish));

const NAMES = [
  "Rocío Alarcón",
  "Pedro Guevara",
  "Nadia Cornejo",
  "Sergio Palomino",
  "Elena Maldonado",
  "Bruno Cáceres",
  "Fiorella Ayala",
  "Walter Linares",
];

const pick = <T>(list: readonly T[], random: () => number): T =>
  list[Math.floor(random() * list.length) % list.length] as T;

const nextId = (rows: ReadonlyArray<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;

const phone = (random: () => number) => `9${String(Math.floor(random() * 1e8)).padStart(8, "0")}`;

let notificationSeq = 0;
const notification = (
  kind: DemoNotification["kind"],
  title: string,
  detail: string,
): DemoNotification => ({
  id: (notificationSeq += 1),
  kind,
  title,
  detail,
  at: new Date().toISOString(),
  isRead: false,
});

export const useDemoStore = create<DemoState>((set, get) => ({
  dishes: [],
  orders: [],
  reservations: [],
  staff: [],
  salesHistoryCents: [],
  notifications: [],
  isReady: false,

  reset: () => set({ ...createDemoData(Date.now()), notifications: [], isReady: true }),
  ensureReady: () => {
    if (!get().isReady) get().reset();
  },

  setDishPrice: (id, priceCents) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, (d) => ({ ...d, priceCents })) })),

  setDishAvailable: (id, isAvailable) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, (d) => ({ ...d, isAvailable })) })),

  addDish: (data) => {
    const dish: Dish = { ...data, id: nextId(get().dishes) };
    set((state) => ({ dishes: [...state.dishes, dish] }));
    return dish;
  },

  updateDish: (id, data) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, () => ({ ...data, id })) })),

  removeDish: (id) => set((state) => ({ dishes: state.dishes.filter((d) => d.id !== id) })),

  advanceOrder: (id, status) =>
    set((state) => ({
      orders: state.orders.map((order: PanelOrder) =>
        order.id === id && canTransition(order.status, status, order.modality)
          ? { ...order, status }
          : order,
      ),
    })),

  setReservationStatus: (id, status) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
    })),

  addReservation: (reservation) => {
    const created: PanelReservation = { ...reservation, id: nextId(get().reservations) };
    set((state) => ({
      reservations: [...state.reservations, created].sort(
        (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
      ),
    }));
    return created;
  },

  inviteMember: (invite) => {
    const member: Member = {
      id: nextId(get().staff),
      name: invite.name,
      email: invite.email.trim().toLowerCase(),
      role: invite.role,
      branch: invite.branch === "" ? null : invite.branch,
      isActive: true,
      isPending: true,
    };
    set((state) => ({ staff: [...state.staff, member] }));
    return member;
  },

  setMemberRole: (id, role) => {
    const result = canChange(get().staff, id, { role });
    if (result.ok) {
      set((state) => ({
        staff: state.staff.map((m) =>
          m.id === id
            ? { ...m, role, branch: role === "admin" ? m.branch : (m.branch ?? "Lince") }
            : m,
        ),
      }));
    }
    return result;
  },

  setMemberActive: (id, isActive) => {
    const result = canChange(get().staff, id, { isActive });
    if (result.ok) {
      set((state) => ({ staff: state.staff.map((m) => (m.id === id ? { ...m, isActive } : m)) }));
    }
    return result;
  },

  simulateOrder: (random = Math.random) => {
    const { dishes, orders } = get();
    const sellable = dishes.filter((d) => !isSoldOut(d));
    const first = pick(sellable.length > 0 ? sellable : dishes, random);
    const second = random() > 0.5 ? pick(sellable, random) : undefined;
    const lines = [
      { dish: first, quantity: 1 + Math.floor(random() * 2) },
      ...(second && second.id !== first?.id ? [{ dish: second, quantity: 1 }] : []),
    ].filter((line): line is { dish: Dish; quantity: number } => Boolean(line.dish));
    const total = lines.reduce((sum, l) => sum + l.dish.priceCents * l.quantity, 0);
    const delivery = random() > 0.5;
    const branchName = random() > 0.5 ? "Lince" : "Jesús María";
    const order: PanelOrder = {
      id: nextId(orders),
      status: "received",
      modality: delivery ? "delivery" : "pickup",
      customerName: pick(NAMES, random),
      customerPhone: phone(random),
      district: delivery ? branchName : null,
      address: delivery ? "Av. Arequipa 1450" : null,
      scheduledFor: null,
      notes: null,
      totalCents: total,
      paymentMethod: "cash",
      createdAt: new Date().toISOString(),
      branchName,
      items: lines.map((l) => ({
        name: l.dish.name,
        variantLabel: null,
        quantity: l.quantity,
        notes: null,
        choices: [],
      })),
    };
    const alert = notification(
      "order",
      `Pedido nuevo N.º ${order.id}`,
      `${order.customerName} · ${order.modality === "pickup" ? "Recojo" : "Delivery"} · ${branchName}`,
    );
    set((state) => ({
      orders: [order, ...state.orders],
      notifications: [alert, ...state.notifications],
    }));
    return alert;
  },

  simulateReservation: (random = Math.random) => {
    const { reservations } = get();
    const now = Date.now();
    const days = [dateKeyLima(now), dateKeyLima(now + 24 * 60 * 60 * 1000)];
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const branch = random() > 0.5 ? "Lince" : "Jesús María";
      const date = pick(days, random);
      const time = pick(slotTimes(), random);
      const partySize = 2 + Math.floor(random() * 5);
      const area = pick(["interior", "terraza", "cualquiera"] as const, random);
      if (!checkSlot(reservations, { branch, date, time, partySize, area, now }).ok) continue;
      const created: PanelReservation = {
        id: nextId(reservations),
        startsAt: slotStart(date, time).toISOString(),
        partySize,
        area: area === "cualquiera" ? null : area,
        occasion: null,
        name: pick(NAMES, random),
        phone: phone(random),
        status: "confirmed",
        branch,
        source: "web",
        notes: null,
        email: null,
      };
      const alert = notification(
        "reservation",
        "Reserva nueva",
        `${created.name} · ${partySize} personas · ${time} · ${branch} · ${SOURCE_LABELS.web}`,
      );
      set((state) => ({
        reservations: [...state.reservations, created].sort(
          (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
        ),
        notifications: [alert, ...state.notifications],
      }));
      return alert;
    }
    return null;
  },

  markAllRead: () =>
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, isRead: true })) })),
}));
