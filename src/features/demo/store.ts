"use client";

import { create } from "zustand";

import type { PanelReservation } from "@/components/panel/ReservationsBoard";
import { withStock } from "@/features/carta/logic";
import type { Dish, NewDishForm } from "@/features/carta/schema";
import type { PanelOrder } from "@/features/orders/panel";
import { canTransition, type OrderStatus } from "@/features/orders/status";

import { createDemoData, type DemoData } from "./seed";

/**
 * Datos de ejemplo del panel en el navegador (modo demostración).
 * Viven en memoria: al recargar la página vuelven a los datos de partida.
 * El estado inicial se crea al montar (`reset`), no al importar el módulo, para que el
 * servidor y el navegador no generen horas distintas.
 */
type DemoState = DemoData & {
  isReady: boolean;
  reset: () => void;
  ensureReady: () => void;

  setDishPrice: (id: number, priceCents: number) => void;
  setDishAvailable: (id: number, isAvailable: boolean) => void;
  setDishStock: (id: number, qty: number | null) => void;
  addDish: (form: NewDishForm) => Dish;
  removeDish: (id: number) => void;

  advanceOrder: (id: number, status: OrderStatus) => void;
  setReservationStatus: (id: number, status: PanelReservation["status"]) => void;
};

const mapDish = (dishes: Dish[], id: number, change: (dish: Dish) => Dish) =>
  dishes.map((dish) => (dish.id === id ? change(dish) : dish));

export const useDemoStore = create<DemoState>((set, get) => ({
  dishes: [],
  orders: [],
  reservations: [],
  isReady: false,

  reset: () => set({ ...createDemoData(Date.now()), isReady: true }),
  ensureReady: () => {
    if (!get().isReady) get().reset();
  },

  setDishPrice: (id, priceCents) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, (d) => ({ ...d, priceCents })) })),

  setDishAvailable: (id, isAvailable) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, (d) => ({ ...d, isAvailable })) })),

  setDishStock: (id, qty) =>
    set((state) => ({ dishes: mapDish(state.dishes, id, (d) => withStock(d, qty)) })),

  addDish: (form) => {
    const dish: Dish = {
      id: Math.max(0, ...get().dishes.map((d) => d.id)) + 1,
      name: form.name,
      description: form.description,
      category: form.category,
      priceCents: form.price,
      stockQty: form.stock,
      isAvailable: form.stock !== 0,
    };
    set((state) => ({ dishes: [...state.dishes, dish] }));
    return dish;
  },

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
}));
