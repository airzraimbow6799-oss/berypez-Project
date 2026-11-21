import { z } from "zod";

/**
 * Contrato de la carta administrable (módulo 2 del plan). Hoy lo usa el modo demostración;
 * cuando llegue el backend real (B-R2) la misma validación se aplica en el servidor.
 * Precios en céntimos enteros, como en la base.
 */

export const DISH_CATEGORIES = [
  "Ceviches",
  "Entradas",
  "Parihuelas",
  "Fondos",
  "Piqueos",
  "Bebidas",
] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

export const MAX_PRICE_CENTS = 99_900;
export const MAX_STOCK = 999;

export type Dish = {
  id: number;
  name: string;
  description: string;
  category: DishCategory;
  priceCents: number;
  /** null = no se controla la cantidad (solo disponible / agotado). */
  stockQty: number | null;
  /** Interruptor manual de «agotado». Con stock 0 el plato cuenta como agotado igual. */
  isAvailable: boolean;
};

/** Texto del formulario a número entero: acepta «48», «48.5» y «48,50». */
const soles = z
  .string()
  .trim()
  .min(1, "Escribe el precio.")
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(
    z
      .number({ error: "El precio debe ser un número." })
      .positive("El precio debe ser mayor a cero.")
      .max(MAX_PRICE_CENTS / 100, `El precio no puede pasar de S/ ${MAX_PRICE_CENTS / 100}.`),
  )
  .transform((value) => Math.round(value * 100));

/** Stock opcional: vacío = sin control de cantidad. */
const stock = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .pipe(
    z
      .number({ error: "El stock debe ser un número." })
      .int("El stock debe ser un número entero.")
      .min(0, "El stock no puede ser negativo.")
      .max(MAX_STOCK, `El stock no puede pasar de ${MAX_STOCK}.`)
      .nullable(),
  );

/** Formulario de «Añadir plato». */
export const newDishFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto.")
    .max(80, "El nombre es muy largo.")
    // Regla RF-10: no se permiten duplicados «(Copiar)».
    .refine((value) => !/\(copiar\)/i.test(value), "Quita «(Copiar)» del nombre."),
  description: z.string().trim().max(240, "La descripción es muy larga."),
  category: z.enum(DISH_CATEGORIES, { error: "Elige una categoría." }),
  price: soles,
  stock,
});
export type NewDishForm = z.output<typeof newDishFormSchema>;
export type NewDishFormInput = z.input<typeof newDishFormSchema>;
