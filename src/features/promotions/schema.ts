/**
 * Promociones del panel: tipos, formulario y validación. La misma validación corre en el
 * navegador (para avisar al momento) y en el servidor (antes de guardar).
 */
import { z } from "zod";

import type { Dish, DishImage } from "@/features/carta/schema";
import { PROMOTION_KINDS, type PromotionKind } from "@/types/catalog";

import { isPromotionLive, promoUnitPrice } from "./pricing";

export type Promotion = {
  id: number;
  dishId: number;
  kind: PromotionKind;
  percentOff: number | null;
  priceCents: number | null;
  variantId: number | null;
  title: string;
  /** Imagen propia de la ventana emergente (opcional). */
  image: DishImage | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export const KIND_LABELS: Record<PromotionKind, string> = {
  percent: "Porcentaje de descuento",
  fixed_price: "Precio especial",
  two_for_one: "2×1",
};

export type PromotionStatus = "activa" | "programada" | "pausada" | "vencida";

export const STATUS_LABELS: Record<PromotionStatus, string> = {
  activa: "Activa",
  programada: "Programada",
  pausada: "Pausada",
  vencida: "Vencida",
};

export function promotionStatus(p: Promotion, now: number): PromotionStatus {
  if (!p.isActive) return "pausada";
  if (p.endsAt && Date.parse(p.endsAt) <= now) return "vencida";
  if (p.startsAt && Date.parse(p.startsAt) > now) return "programada";
  return isPromotionLive(p, now) ? "activa" : "pausada";
}

/** Lima es UTC−5 todo el año (sin horario de verano). */
const LIMA_OFFSET = "-05:00";

/** «2026-11-22T18:00» (hora de Lima, del campo fecha y hora) → ISO en UTC. */
export function limaInputToIso(value: string): string | null {
  if (!value) return null;
  const time = Date.parse(`${value}:00${LIMA_OFFSET}`);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** ISO en UTC → «2026-11-22T18:00» en hora de Lima, para el campo fecha y hora. */
export function isoToLimaInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(Date.parse(iso) - 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export type PromotionFormInput = {
  dishId: string;
  kind: PromotionKind;
  percent: string;
  price: string;
  /** Opción del plato para el precio especial («» = el plato sin opciones). */
  variantId: string;
  title: string;
  image: DishImage | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isFeatured: boolean;
};

export type PromotionData = Omit<Promotion, "id" | "createdAt">;

export function emptyPromotionForm(dishId: number | null = null): PromotionFormInput {
  return {
    dishId: dishId === null ? "" : String(dishId),
    kind: "percent",
    percent: "",
    price: "",
    variantId: "",
    title: "",
    image: null,
    startsAt: "",
    endsAt: "",
    isActive: true,
    isFeatured: false,
  };
}

export function promotionToForm(p: Promotion): PromotionFormInput {
  return {
    dishId: String(p.dishId),
    kind: p.kind,
    percent: p.percentOff === null ? "" : String(p.percentOff),
    price: p.priceCents === null ? "" : (p.priceCents / 100).toFixed(2),
    variantId: p.variantId === null ? "" : String(p.variantId),
    title: p.title,
    image: p.image ? { ...p.image } : null,
    // Sin fecha de inicio empezó al crearla: se muestra esa fecha para que el formulario esté completo.
    startsAt: isoToLimaInput(p.startsAt ?? p.createdAt),
    endsAt: isoToLimaInput(p.endsAt),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  };
}

/** Precio normal de lo que se promociona: la opción elegida o el plato. */
export function regularPrice(dish: Dish, variantId: number | null): number {
  const option = dish.priceGroup?.options.find((o) => o.id === variantId);
  return option?.priceCents ?? dish.priceCents;
}

/** Título sugerido si la persona no escribe uno: «20 % en Chicharrones». */
export function suggestedTitle(dish: Dish | undefined, form: PromotionFormInput): string {
  if (!dish) return "";
  if (form.kind === "two_for_one") return `${dish.name} 2×1`;
  if (form.kind === "fixed_price") {
    const price = Number(form.price.replace(",", "."));
    return Number.isFinite(price) && price > 0
      ? `${dish.name} a S/ ${price.toFixed(2)}`
      : dish.name;
  }
  return form.percent ? `${form.percent} % en ${dish.name}` : dish.name;
}

const baseSchema = z.object({
  dishId: z.string().regex(/^\d+$/, "Elige el plato de la promoción."),
  kind: z.enum(PROMOTION_KINDS),
  percent: z.string(),
  price: z.string(),
  variantId: z.string(),
  title: z.string().trim().min(2, "Escribe un título corto.").max(60, "El título es muy largo."),
  image: z.object({ url: z.string().min(1), alt: z.string() }).nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export type PromotionParse =
  { ok: true; data: PromotionData } | { ok: false; errors: Record<string, string> };

/** Valida el formulario contra la carta (el plato existe, el precio especial es menor…). */
export function parsePromotionForm(
  input: PromotionFormInput,
  dishes: readonly Dish[],
): PromotionParse {
  const errors: Record<string, string> = {};
  const withTitle = {
    ...input,
    title:
      input.title.trim() ||
      suggestedTitle(
        dishes.find((d) => String(d.id) === input.dishId),
        input,
      ),
  };
  const parsed = baseSchema.safeParse(withTitle);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors };
  }
  const form = parsed.data;
  const dish = dishes.find((d) => String(d.id) === form.dishId);
  if (!dish) return { ok: false, errors: { dishId: "Elige el plato de la promoción." } };

  let percentOff: number | null = null;
  let priceCents: number | null = null;
  let variantId: number | null = null;

  if (form.kind === "percent") {
    const value = Number(form.percent.trim());
    if (!Number.isInteger(value) || value < 5 || value > 90) {
      errors.percent = "Escribe un porcentaje entero entre 5 y 90.";
    } else percentOff = value;
  }

  if (form.kind === "fixed_price") {
    if (dish.priceGroup) {
      const option = dish.priceGroup.options.find((o) => String(o.id) === form.variantId);
      if (!option?.id) errors.variantId = "Elige a qué opción del plato aplica el precio.";
      else variantId = option.id;
    }
    const value = Number(form.price.trim().replace(",", "."));
    const cents = Math.round(value * 100);
    const regular = regularPrice(dish, variantId);
    if (!form.price.trim() || !Number.isFinite(value) || value <= 0) {
      errors.price = "Escribe el precio de la promoción.";
    } else if (!errors.variantId && cents >= regular) {
      errors.price = `Debe ser menor al precio normal (S/ ${(regular / 100).toFixed(2)}).`;
    } else priceCents = cents;
  }

  const startsAt = limaInputToIso(form.startsAt);
  const endsAt = limaInputToIso(form.endsAt);
  if (form.startsAt && !startsAt) errors.startsAt = "Fecha no válida.";
  if (form.endsAt && !endsAt) errors.endsAt = "Fecha no válida.";
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    errors.endsAt = "La fecha de fin debe ser después del inicio.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      dishId: dish.id,
      kind: form.kind,
      percentOff,
      priceCents,
      variantId,
      title: form.title,
      image: form.image ? { url: form.image.url, alt: form.image.alt || form.title } : null,
      startsAt,
      endsAt,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    },
  };
}

/** Vista previa del precio para el formulario y la lista. */
export function promotionPreview(
  dish: Dish,
  p: Pick<Promotion, "kind" | "percentOff" | "priceCents" | "variantId">,
): { regularCents: number; promoCents: number; text: string } {
  const regularCents = regularPrice(dish, p.variantId);
  const promoCents = promoUnitPrice(regularCents, p, p.variantId);
  const text = p.kind === "two_for_one" ? "Lleva 2 y paga 1" : "";
  return { regularCents, promoCents, text };
}
