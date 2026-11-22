import type { Dish, DishFormInput, DishFormOutput, DishImage } from "@/features/carta/schema";

export type Outcome =
  { ok: true } | { ok: false; message: string; errors?: Record<string, string> };

/**
 * Lo que la pantalla de la carta necesita para leer y guardar. Hay dos: el del modo
 * demostración (datos en el navegador) y el real (acciones del servidor sobre Supabase).
 */
export type CartaBackend = {
  isReady: boolean;
  /** true: los cambios se guardan en la carta real y se ven en la web. */
  isLive: boolean;
  dishes: Dish[];
  setPrice: (dish: Dish, cents: number) => Promise<Outcome>;
  setAvailable: (dish: Dish, isAvailable: boolean) => Promise<Outcome>;
  save: (id: number | null, input: DishFormInput, data: DishFormOutput) => Promise<Outcome>;
  remove: (dish: Dish) => Promise<Outcome>;
  uploadPhoto?: (file: File) => Promise<DishImage>;
};
