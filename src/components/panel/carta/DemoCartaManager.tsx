"use client";

import { CartaManager } from "@/components/panel/CartaManager";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { useDemoStore } from "@/features/demo/store";
import type { StaffRole } from "@/features/staff/roles";

import type { CartaBackend, Outcome } from "./backend";

const OK: Outcome = { ok: true };

/** Carta del modo demostración: los cambios viven en el navegador y nunca tocan la base. */
export function DemoCartaManager({ role }: { role: StaffRole }) {
  const isReady = useDemoReady();
  const dishes = useDemoStore((s) => s.dishes);
  const setDishPrice = useDemoStore((s) => s.setDishPrice);
  const setDishAvailable = useDemoStore((s) => s.setDishAvailable);
  const addDish = useDemoStore((s) => s.addDish);
  const updateDish = useDemoStore((s) => s.updateDish);
  const removeDish = useDemoStore((s) => s.removeDish);

  const backend: CartaBackend = {
    isReady,
    isLive: false,
    dishes,
    setPrice: async (dish, cents) => (setDishPrice(dish.id, cents), OK),
    setAvailable: async (dish, on) => (setDishAvailable(dish.id, on), OK),
    save: async (id, _input, data) => {
      if (id === null) addDish(data);
      else updateDish(id, data);
      return OK;
    },
    remove: async (dish) => (removeDish(dish.id), OK),
  };

  return <CartaManager role={role} backend={backend} />;
}
