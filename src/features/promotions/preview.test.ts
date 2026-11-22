import { describe, expect, it } from "vitest";

import { seedDishes, seedPromotions } from "@/features/demo/seed";

import { previewProducts } from "./preview";

const NOW = Date.parse("2026-11-22T15:00:00Z");

describe("previewProducts", () => {
  it("muestra solo las vigentes, la destacada primero", () => {
    const dishes = seedDishes();
    const products = previewProducts(seedPromotions(dishes, NOW), dishes, NOW);
    expect(products.map((p) => p.promotion?.title)).toEqual([
      "Chicharrones 2×1",
      "Martes de ceviche",
    ]);
    expect(products[0]?.image).not.toBeNull();
  });

  it("no muestra nada si todas están pausadas", () => {
    const dishes = seedDishes();
    const paused = seedPromotions(dishes, NOW).map((p) => ({ ...p, isActive: false }));
    expect(previewProducts(paused, dishes, NOW)).toEqual([]);
  });
});
