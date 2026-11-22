"use client";

import { useState } from "react";

import { saveDish, uploadDishPhoto } from "@/app/panel/(protegido)/carta/actions";
import {
  deletePromotion,
  type PromotionsResult,
  savePromotion,
  setPromotionFlag,
} from "@/app/panel/(protegido)/promociones/actions";
import type { Outcome } from "@/components/panel/carta/backend";
import { compressPhoto } from "@/features/carta/compress-photo";
import type { Dish } from "@/features/carta/schema";
import type { Promotion } from "@/features/promotions/schema";

import type { PromotionsBackend } from "./backend";
import { PromotionsManager } from "./PromotionsManager";

const OFFLINE = "No hay conexión con el servidor. Inténtalo de nuevo.";

/** Promociones reales: se guardan en Supabase y la web se actualiza al instante. */
export function LivePromotionsManager({
  initialPromotions,
  initialDishes,
}: {
  initialPromotions: Promotion[];
  initialDishes: Dish[];
}) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [dishes, setDishes] = useState(initialDishes);

  const run = async (action: () => Promise<PromotionsResult>): Promise<Outcome> => {
    try {
      const result = await action();
      if (!result.ok) return result;
      setPromotions(result.promotions);
      return { ok: true };
    } catch {
      return { ok: false, message: OFFLINE };
    }
  };

  const backend: PromotionsBackend = {
    isReady: true,
    isLive: true,
    promotions,
    dishes,
    save: (id, input) => run(() => savePromotion(id, input)),
    setFlag: (promo, flag, value) => run(() => setPromotionFlag(promo.id, flag, value)),
    remove: (promo) => run(() => deletePromotion(promo.id)),
    createDish: async (input) => {
      try {
        const result = await saveDish(null, input);
        if (!result.ok) return result;
        const known = new Set(dishes.map((d) => d.id));
        const created = result.dishes.find((d) => !known.has(d.id));
        setDishes(result.dishes);
        return created
          ? { ok: true, dish: created }
          : { ok: false, message: "El plato se guardó, pero no lo encontramos. Recarga." };
      } catch {
        return { ok: false, message: OFFLINE };
      }
    },
    uploadPhoto: async (file) => {
      const form = new FormData();
      form.set("photo", await compressPhoto(file));
      const result = await uploadDishPhoto(form);
      if (!result.ok) throw new Error(result.message);
      return { url: result.url, alt: "" };
    },
  };

  return <PromotionsManager backend={backend} />;
}
