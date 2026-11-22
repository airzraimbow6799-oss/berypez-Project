import { z } from "zod";

import { MENU_SLUGS, type MenuSlug, PRODUCT_TAGS, type ProductTag } from "@/types/catalog";

/**
 * Contrato de la carta administrable (módulo 2 del plan). Hoy lo usa el modo demostración;
 * cuando llegue el backend real (B-R2) la misma validación se aplica en el servidor.
 * Precios en céntimos enteros, como en la base. Sin stock: un plato está disponible o agotado.
 *
 * Un plato puede tener «apartados» para que la persona elija al pedir (como en la vista rápida):
 * - un apartado **con precio** («Elige tu chicharrón»: Pesca del día S/ 40, Calamar S/ 48…);
 * - los apartados **sin precio** que haga falta («Elige el tipo»: Filete 200 g, Entero 550 g).
 * Son opcionales: un plato simple no tiene ninguno.
 */

export const MAX_PRICE_CENTS = 99_900;
export const MAX_OPTIONS = 12;
export const MAX_CHOICE_GROUPS = 4;

/** Nombre legible de cada etiqueta (las mismas que usan los filtros y el buscador de la web). */
export const TAG_LABELS: Record<ProductTag, string> = {
  picante: "Picante",
  vegetariano: "Vegetariano",
  compartir: "Para compartir",
  favorito: "Favorito de la casa",
  ninos: "Para niños",
  nuevo: "Nuevo",
};

export type DishImage = { url: string; alt: string };
/** `id`: la variante en la base (solo en platos reales), para conservar su historial. */
export type PriceOption = { id?: number; label: string; priceCents: number };
export type PriceGroup = { label: string; options: PriceOption[] };
export type ChoiceGroupDraft = { label: string; options: string[] };

export type Dish = {
  id: number;
  /** Slug del plato en la web (los de ejemplo lo traen para enlazar con la carta real). */
  slug?: string;
  name: string;
  description: string;
  /** Cartas donde aparece (un plato puede estar en Marina y en Criolla). */
  menus: MenuSlug[];
  /** Sección dentro de la carta: Ceviches, Sudados, Fuentes… */
  section: string;
  /** Precio normal; si tiene apartado con precio, el menor de sus opciones («desde»). */
  priceCents: number;
  image: DishImage | null;
  tags: ProductTag[];
  isAvailable: boolean;
  priceGroup: PriceGroup | null;
  choiceGroups: ChoiceGroupDraft[];
};

/** Texto del formulario a céntimos: acepta «48», «48.5» y «48,50». */
const soles = (missing: string) =>
  z
    .string()
    .trim()
    .min(1, missing)
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(
      z
        .number({ error: "El precio debe ser un número." })
        .positive("El precio debe ser mayor a cero.")
        .max(MAX_PRICE_CENTS / 100, `El precio no puede pasar de S/ ${MAX_PRICE_CENTS / 100}.`),
    )
    .transform((value) => Math.round(value * 100));

const groupTitle = z
  .string()
  .trim()
  .min(2, "Escribe el título del apartado, por ejemplo «Elige tu pescado».")
  .max(60, "El título es muy largo.");

const optionName = z
  .string()
  .trim()
  .min(1, "Escribe el nombre de la opción.")
  .max(60, "El nombre de la opción es muy largo.");

const hasDuplicates = (names: string[]) =>
  new Set(names.map((n) => n.trim().toLowerCase())).size !== names.length;

const priceGroupForm = z
  .object({
    label: groupTitle,
    options: z
      .array(z.object({ label: optionName, price: soles("Escribe el precio de la opción.") }))
      .min(2, "Agrega al menos 2 opciones. Si hay una sola, usa el precio normal del plato.")
      .max(MAX_OPTIONS, `Máximo ${MAX_OPTIONS} opciones.`),
  })
  .refine((g) => !hasDuplicates(g.options.map((o) => o.label)), {
    path: ["options"],
    message: "Hay dos opciones con el mismo nombre.",
  });

const choiceGroupForm = z
  .object({
    label: groupTitle,
    options: z
      .array(optionName)
      .min(2, "Agrega al menos 2 opciones para elegir.")
      .max(MAX_OPTIONS, `Máximo ${MAX_OPTIONS} opciones.`),
  })
  .refine((g) => !hasDuplicates(g.options), {
    path: ["options"],
    message: "Hay dos opciones con el mismo nombre.",
  });

/** Formulario de «Añadir plato» y «Editar plato» (los textos tal como se escriben). */
export const dishFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre es muy corto.")
      .max(80, "El nombre es muy largo.")
      // Regla RF-10: no se permiten duplicados «(Copiar)».
      .refine((value) => !/\(copiar\)/i.test(value), "Quita «(Copiar)» del nombre."),
    description: z.string().trim().max(240, "La descripción es muy larga."),
    menus: z.array(z.enum(MENU_SLUGS)).min(1, "Elige al menos una carta."),
    section: z
      .string()
      .trim()
      .min(2, "Escribe la sección, por ejemplo «Ceviches».")
      .max(40, "La sección es muy larga."),
    /** Precio normal; solo obligatorio si el plato no tiene apartado con precio. */
    price: z.string(),
    image: z.object({ url: z.string().min(1), alt: z.string() }).nullable(),
    tags: z.array(z.enum(PRODUCT_TAGS)),
    isAvailable: z.boolean(),
    priceGroup: priceGroupForm.nullable(),
    choiceGroups: z
      .array(choiceGroupForm)
      .max(MAX_CHOICE_GROUPS, `Máximo ${MAX_CHOICE_GROUPS} apartados.`),
  })
  .superRefine((form, ctx) => {
    if (form.priceGroup !== null) return;
    const parsed = soles("Escribe el precio.").safeParse(form.price);
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: parsed.error.issues[0]?.message ?? "Escribe el precio.",
      });
    }
  })
  .transform((form): Omit<Dish, "id"> => {
    const priceGroup = form.priceGroup
      ? {
          label: form.priceGroup.label,
          options: form.priceGroup.options.map((o) => ({ label: o.label, priceCents: o.price })),
        }
      : null;
    const priceCents = priceGroup
      ? Math.min(...priceGroup.options.map((o) => o.priceCents))
      : Math.round(Number(form.price.trim().replace(",", ".")) * 100);
    return {
      name: form.name,
      description: form.description,
      menus: form.menus,
      section: form.section,
      priceCents,
      // La foto se describe con el nombre del plato (texto alternativo para lectores de pantalla).
      image: form.image ? { url: form.image.url, alt: form.image.alt || form.name } : null,
      tags: form.tags,
      isAvailable: form.isAvailable,
      priceGroup,
      choiceGroups: form.choiceGroups,
    };
  });

export type DishFormInput = z.input<typeof dishFormSchema>;
export type DishFormOutput = z.output<typeof dishFormSchema>;

/** Formulario vacío para «Añadir plato». */
export function emptyDishForm(menu: MenuSlug = "marina"): DishFormInput {
  return {
    name: "",
    description: "",
    menus: [menu],
    section: "",
    price: "",
    image: null,
    tags: [],
    isAvailable: true,
    priceGroup: null,
    choiceGroups: [],
  };
}

const toSoles = (cents: number) => (cents / 100).toFixed(2);

/** Un plato guardado, como valores del formulario de «Editar plato». */
export function dishToForm(dish: Dish): DishFormInput {
  return {
    name: dish.name,
    description: dish.description,
    menus: [...dish.menus],
    section: dish.section,
    price: dish.priceGroup ? "" : toSoles(dish.priceCents),
    image: dish.image ? { ...dish.image } : null,
    tags: [...dish.tags],
    isAvailable: dish.isAvailable,
    priceGroup: dish.priceGroup
      ? {
          label: dish.priceGroup.label,
          options: dish.priceGroup.options.map((o) => ({
            label: o.label,
            price: toSoles(o.priceCents),
          })),
        }
      : null,
    choiceGroups: dish.choiceGroups.map((g) => ({ label: g.label, options: [...g.options] })),
  };
}

/** Errores del formulario por campo («priceGroup.options.1.price» → mensaje). */
export function formErrors(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
