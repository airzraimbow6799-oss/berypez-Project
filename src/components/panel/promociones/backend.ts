import type { Outcome } from "@/components/panel/carta/backend";
import type { Dish, DishFormInput, DishFormOutput, DishImage } from "@/features/carta/schema";
import type { Promotion, PromotionData, PromotionFormInput } from "@/features/promotions/schema";

export type DishCreated = { ok: true; dish: Dish } | Extract<Outcome, { ok: false }>;

/** Lo que la pantalla de Promociones necesita: real (Supabase) o de demostración. */
export type PromotionsBackend = {
  isReady: boolean;
  isLive: boolean;
  promotions: Promotion[];
  /** Platos de la carta para elegir. */
  dishes: Dish[];
  save: (id: number | null, input: PromotionFormInput, data: PromotionData) => Promise<Outcome>;
  setFlag: (promo: Promotion, flag: "isActive" | "isFeatured", value: boolean) => Promise<Outcome>;
  remove: (promo: Promotion) => Promise<Outcome>;
  /** Crea un plato nuevo desde la promoción (mismo formulario de la carta). */
  createDish: (input: DishFormInput, data: DishFormOutput) => Promise<DishCreated>;
  uploadPhoto?: (file: File) => Promise<DishImage>;
};
