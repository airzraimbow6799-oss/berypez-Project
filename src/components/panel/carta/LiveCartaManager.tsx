"use client";

import { useState } from "react";

import {
  type CartaResult,
  removeDish,
  saveDish,
  setDishAvailable,
  setDishPrice,
  uploadDishPhoto,
} from "@/app/panel/(protegido)/carta/actions";
import { CartaManager } from "@/components/panel/CartaManager";
import { compressPhoto } from "@/features/carta/compress-photo";
import type { Dish } from "@/features/carta/schema";
import type { StaffRole } from "@/features/staff/roles";

import type { CartaBackend, Outcome } from "./backend";

const OFFLINE = "No hay conexión con el servidor. Inténtalo de nuevo.";

/** Carta real: cada cambio se guarda en Supabase y la web pública se actualiza al instante. */
export function LiveCartaManager({
  role,
  initialDishes,
}: {
  role: StaffRole;
  initialDishes: Dish[];
}) {
  const [dishes, setDishes] = useState(initialDishes);

  const run = async (action: () => Promise<CartaResult>): Promise<Outcome> => {
    try {
      const result = await action();
      if (!result.ok) return result;
      setDishes(result.dishes);
      return { ok: true };
    } catch {
      return { ok: false, message: OFFLINE };
    }
  };

  const backend: CartaBackend = {
    isReady: true,
    isLive: true,
    dishes,
    setPrice: (dish, cents) => run(() => setDishPrice(dish.id, cents)),
    setAvailable: (dish, on) => {
      // Se ve al instante; si el servidor falla, la lista vuelve a lo que diga la base.
      setDishes((list) => list.map((d) => (d.id === dish.id ? { ...d, isAvailable: on } : d)));
      return run(() => setDishAvailable(dish.id, on)).then((outcome) => {
        if (!outcome.ok) {
          setDishes((list) => list.map((d) => (d.id === dish.id ? { ...d, isAvailable: !on } : d)));
        }
        return outcome;
      });
    },
    save: (id, input) => run(() => saveDish(id, input)),
    remove: (dish) => run(() => removeDish(dish.id)),
    uploadPhoto: async (file) => {
      const small = await compressPhoto(file);
      const form = new FormData();
      form.set("photo", small);
      const result = await uploadDishPhoto(form);
      if (!result.ok) throw new Error(result.message);
      return { url: result.url, alt: "" };
    },
  };

  return <CartaManager role={role} backend={backend} />;
}
