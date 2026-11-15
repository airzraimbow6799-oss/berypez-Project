import { describe, expect, it } from "vitest";

import { CAUSA_VERDURAS_ROW, MILANESA_ROW, PARIHUELA_ROW } from "./fixtures";
import { imageUrl, toProduct } from "./mappers";

const STORAGE = "https://abcd.supabase.co";

describe("imageUrl", () => {
  it("arma la URL pública del bucket catalog", () => {
    expect(imageUrl(STORAGE, "products/parihuelas.webp")).toBe(
      "https://abcd.supabase.co/storage/v1/object/public/catalog/products/parihuelas.webp",
    );
  });
});

describe("toProduct", () => {
  it("convierte la fila al contrato v1 con variantes ordenadas", () => {
    const product = toProduct(PARIHUELA_ROW, STORAGE);
    expect(product).toMatchObject({
      id: 300,
      slug: "parihuelas",
      priceCents: 4200,
      variantLabel: "Elige tu pescado",
      categoryId: 63,
      menus: ["marina"],
      image: {
        url: "https://abcd.supabase.co/storage/v1/object/public/catalog/products/parihuelas.webp",
        alt: "Parihuelas",
      },
    });
    expect(product.variants.map((v) => v.label)).toEqual(["Pesca del día (filete)", "Cabrilla"]);
  });

  it("valida los grupos de elección y las selecciones con valores libres", () => {
    const product = toProduct(MILANESA_ROW, STORAGE);
    expect(product.choiceGroups).toEqual([
      {
        key: "Guarnición 01",
        label: "Elige tu primer acompañamiento",
        options: ["Arroz", "Papas fritas"],
      },
    ]);
    expect(product.variants[0]?.selections).toEqual({ "Guarnición 01": null });
  });

  it("devuelve image null sin foto y conserva las etiquetas válidas", () => {
    const product = toProduct(CAUSA_VERDURAS_ROW, STORAGE);
    expect(product.image).toBeNull();
    expect(product.tags).toEqual(["vegetariano"]);
    expect(product.variants).toEqual([]);
  });

  it("descarta etiquetas y alérgenos desconocidos", () => {
    const product = toProduct(
      { ...CAUSA_VERDURAS_ROW, tags: ["vegetariano", "otro"], allergens: ["gluten", "x"] },
      STORAGE,
    );
    expect(product.tags).toEqual(["vegetariano"]);
    expect(product.allergens).toEqual(["gluten"]);
  });

  it("falla con un mensaje claro si choice_groups está corrupto", () => {
    expect(() => toProduct({ ...MILANESA_ROW, choice_groups: [{ key: 1 }] }, STORAGE)).toThrowError(
      /Milanesa de pollo/,
    );
  });

  it("usa el nombre del plato como texto alternativo si falta image_alt", () => {
    const product = toProduct({ ...PARIHUELA_ROW, image_alt: null }, STORAGE);
    expect(product.image?.alt).toBe("Parihuelas");
  });
});
