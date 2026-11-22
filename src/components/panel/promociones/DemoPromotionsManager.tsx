"use client";

import type { Outcome } from "@/components/panel/carta/backend";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { useDemoStore } from "@/features/demo/store";

import type { PromotionsBackend } from "./backend";
import { PromotionsManager } from "./PromotionsManager";

const OK: Outcome = { ok: true };

/** Promociones del modo demostración: datos de ejemplo en el navegador. */
export function DemoPromotionsManager() {
  const isReady = useDemoReady();
  const promotions = useDemoStore((s) => s.promotions);
  const dishes = useDemoStore((s) => s.dishes);
  const savePromotion = useDemoStore((s) => s.savePromotion);
  const setPromotionFlag = useDemoStore((s) => s.setPromotionFlag);
  const removePromotion = useDemoStore((s) => s.removePromotion);
  const addDish = useDemoStore((s) => s.addDish);

  const backend: PromotionsBackend = {
    isReady,
    isLive: false,
    promotions,
    dishes,
    save: async (id, _input, data) => (savePromotion(id, data), OK),
    setFlag: async (promo, flag, value) => (setPromotionFlag(promo.id, flag, value), OK),
    remove: async (promo) => (removePromotion(promo.id), OK),
    createDish: async (_input, data) => ({ ok: true, dish: addDish(data) }),
  };

  return <PromotionsManager backend={backend} />;
}
