import { describe, expect, it } from "vitest";

import { seedDishes } from "@/features/demo/seed";

import {
  emptyPromotionForm,
  isoToLimaInput,
  limaInputToIso,
  parsePromotionForm,
  type Promotion,
  promotionStatus,
  promotionToForm,
  suggestedTitle,
} from "./schema";

const dishes = seedDishes();
const byName = (name: string) => dishes.find((d) => d.name === name)!;
const ceviche = byName("Ceviche Berypez");
const chicharrones = byName("Chicharrones");

describe("hora de Lima", () => {
  it("convierte ida y vuelta (Lima = UTC−5)", () => {
    expect(limaInputToIso("2026-11-22T18:00")).toBe("2026-11-22T23:00:00.000Z");
    expect(isoToLimaInput("2026-11-22T23:00:00.000Z")).toBe("2026-11-22T18:00");
    expect(limaInputToIso("")).toBeNull();
  });
});

describe("parsePromotionForm", () => {
  const form = (over = {}) => ({ ...emptyPromotionForm(ceviche.id), ...over });

  it("porcentaje válido con título sugerido si se deja vacío", () => {
    const parsed = parsePromotionForm(form({ percent: "20" }), dishes);
    expect(parsed).toMatchObject({
      ok: true,
      data: { kind: "percent", percentOff: 20, title: "20 % en Ceviche Berypez" },
    });
  });

  it("rechaza porcentaje fuera de rango y plato sin elegir", () => {
    expect(parsePromotionForm(form({ percent: "95" }), dishes)).toMatchObject({
      ok: false,
      errors: { percent: expect.any(String) },
    });
    expect(parsePromotionForm(form({ dishId: "", title: "Promo" }), dishes)).toMatchObject({
      ok: false,
      errors: { dishId: expect.any(String) },
    });
  });

  it("precio especial: debe ser menor al normal y, con opciones, elegir la opción", () => {
    const fixed = { kind: "fixed_price" as const, dishId: String(chicharrones.id) };
    expect(parsePromotionForm(form({ ...fixed, price: "30" }), dishes)).toMatchObject({
      ok: false,
      errors: { variantId: expect.any(String) },
    });
    const calamar = chicharrones.priceGroup!.options.find((o) => o.label === "Calamar")!;
    // En el demo las opciones no traen id de la base: el panel real sí.
    const withIds = dishes.map((d) =>
      d.id === chicharrones.id
        ? {
            ...d,
            priceGroup: {
              ...d.priceGroup!,
              options: d.priceGroup!.options.map((o, i) => ({ ...o, id: 100 + i })),
            },
          }
        : d,
    );
    const calamarId = 100 + chicharrones.priceGroup!.options.indexOf(calamar);
    expect(
      parsePromotionForm(form({ ...fixed, variantId: String(calamarId), price: "50" }), withIds),
    ).toMatchObject({ ok: false, errors: { price: expect.stringContaining("menor") } });
    expect(
      parsePromotionForm(form({ ...fixed, variantId: String(calamarId), price: "39,90" }), withIds),
    ).toMatchObject({ ok: true, data: { priceCents: 3990, variantId: calamarId } });
  });

  it("2×1 no pide valores y la fecha de fin debe ser después del inicio", () => {
    expect(parsePromotionForm(form({ kind: "two_for_one" }), dishes)).toMatchObject({
      ok: true,
      data: { kind: "two_for_one", percentOff: null, priceCents: null },
    });
    expect(
      parsePromotionForm(
        form({ kind: "two_for_one", startsAt: "2026-11-25T10:00", endsAt: "2026-11-24T10:00" }),
        dishes,
      ),
    ).toMatchObject({ ok: false, errors: { endsAt: expect.any(String) } });
  });
});

describe("estado y formulario", () => {
  const now = Date.parse("2026-11-22T12:00:00Z");
  const promo: Promotion = {
    id: 1,
    dishId: ceviche.id,
    kind: "percent",
    percentOff: 20,
    priceCents: null,
    variantId: null,
    title: "Martes",
    image: null,
    startsAt: null,
    endsAt: null,
    isActive: true,
    isFeatured: false,
    createdAt: "2026-11-20T00:00:00Z",
  };

  it("calcula activa, pausada, programada y vencida", () => {
    expect(promotionStatus(promo, now)).toBe("activa");
    expect(promotionStatus({ ...promo, isActive: false }, now)).toBe("pausada");
    expect(promotionStatus({ ...promo, startsAt: "2026-11-23T00:00:00Z" }, now)).toBe("programada");
    expect(promotionStatus({ ...promo, endsAt: "2026-11-21T00:00:00Z" }, now)).toBe("vencida");
  });

  it("una promoción guardada vuelve al formulario y se guarda igual", () => {
    const parsed = parsePromotionForm(promotionToForm(promo), dishes);
    const { id: _id, createdAt: _c, ...data } = promo;
    expect(parsed).toEqual({ ok: true, data });
  });

  it("sugiere títulos por tipo", () => {
    expect(suggestedTitle(chicharrones, { ...emptyPromotionForm(), kind: "two_for_one" })).toBe(
      "Chicharrones 2×1",
    );
  });
});
