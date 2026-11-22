import { beforeEach, describe, expect, it } from "vitest";

import type { MenuPage, Product } from "@/types/catalog";

import { applyDemoPromotions } from "./apply-promos";
import { clearDemoPromos, saveDemoPromos } from "./promo-storage";
import { demoWebPromos } from "./public-promos";
import { seedDishes, seedPromotions } from "./seed";

const NOW = Date.parse("2026-11-22T15:00:00Z");

const product = (slug: string, over: Partial<Product> = {}): Product => ({
  id: 500,
  slug,
  name: slug,
  description: "",
  priceCents: 4000,
  variantLabel: null,
  categoryId: 1,
  menus: ["marina"],
  image: null,
  tags: [],
  allergens: [],
  portion: null,
  isAvailable: true,
  variants: [],
  choiceGroups: [],
  ...over,
});

const pageWith = (products: Product[]): MenuPage =>
  ({
    menu: { slug: "marina" },
    menus: [],
    sections: [{ category: { id: 1, slug: "s", name: "S" }, products }],
  }) as unknown as MenuPage;

beforeEach(() => clearDemoPromos());

describe("demoWebPromos", () => {
  it("sin nada guardado usa las promociones de ejemplo (la destacada primero)", () => {
    const data = demoWebPromos(NOW);
    expect(data.popup.map((p) => p.promotion?.title)).toEqual([
      "Chicharrones 2×1",
      "Martes de ceviche",
    ]);
    expect(data.popup[0]?.slug).toBe("chicharrones");
  });

  it("usa lo que se guardó desde el panel de demostración", () => {
    const dishes = seedDishes();
    const promotions = seedPromotions(dishes, NOW).map((p) =>
      p.id === 3 ? { ...p, isActive: true, isFeatured: true } : { ...p, isFeatured: false },
    );
    saveDemoPromos({ promotions, dishes });
    expect(demoWebPromos(NOW).popup[0]?.promotion?.title).toBe("Lomo saltado a S/ 39");
  });

  it("sin promociones activas no hay ventana", () => {
    const dishes = seedDishes();
    const paused = seedPromotions(dishes, NOW).map((p) => ({ ...p, isActive: false }));
    saveDemoPromos({ promotions: paused, dishes });
    expect(demoWebPromos(NOW).popup).toEqual([]);
  });
});

describe("applyDemoPromotions", () => {
  it("pone la promoción en el plato real por su slug y arma la franja", () => {
    const data = demoWebPromos(NOW);
    const { page, promoted } = applyDemoPromotions(
      pageWith([product("chicharrones"), product("otro-plato")]),
      data,
    );
    const [chicharrones, otro] = page.sections[0]!.products;
    expect(chicharrones?.promotion?.kind).toBe("two_for_one");
    expect(otro?.promotion).toBeUndefined();
    expect(promoted.map((p) => p.slug)).toEqual(["chicharrones"]);
  });
});
