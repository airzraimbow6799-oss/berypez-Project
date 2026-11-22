import { describe, expect, it } from "vitest";

import {
  type DishRow,
  imagePathFromUrl,
  publicImageUrl,
  rowToDish,
  slugify,
  toSavePayload,
} from "./bridge";
import { dishFormSchema, dishToForm } from "./schema";

const URL_BASE = "https://abc.supabase.co";

const row = (over: Partial<DishRow> = {}): DishRow => ({
  id: 1663,
  name: "Chicharrones",
  description: "Con yuca frita",
  price_cents: 4000,
  variant_label: "Elige tu chicharrón",
  image_path: "products/chicharrones.webp",
  image_alt: null,
  tags: ["compartir", "otra"],
  is_available: true,
  choice_groups: [{ key: "Tipo", label: "Elige el tipo", options: ["A", "B"] }],
  categories: { name: "Chicharrones" },
  product_menus: [{ menu_slug: "marina" }, { menu_slug: "desconocida" }],
  variants: [
    { id: 11, label: "Calamar", price_cents: 4800, sort_order: 2, is_archived: false },
    { id: 10, label: "Pesca del día", price_cents: 4000, sort_order: 1, is_archived: false },
    { id: 12, label: "Pulpo", price_cents: 6000, sort_order: 3, is_archived: true },
  ],
  ...over,
});

describe("slugify e imágenes", () => {
  it("arma slugs sin tildes ni símbolos", () => {
    expect(slugify("Ceviche de Champiñones (6 unid)")).toBe("ceviche-de-champinones-6-unid");
    expect(slugify("¡¡!!")).toBe("plato");
  });
  it("convierte entre URL pública y ruta del bucket", () => {
    const url = publicImageUrl(URL_BASE, "products/panel/a b.webp");
    expect(imagePathFromUrl(URL_BASE, url)).toBe("products/panel/a b.webp");
    expect(imagePathFromUrl(URL_BASE, "blob:http://x/1")).toBeNull();
  });
});

describe("rowToDish", () => {
  it("lleva la fila al plato del panel, sin opciones archivadas ni valores desconocidos", () => {
    const dish = rowToDish(row(), URL_BASE);
    expect(dish).toMatchObject({
      id: 1663,
      section: "Chicharrones",
      menus: ["marina"],
      tags: ["compartir"],
      priceCents: 4000,
      image: { url: `${URL_BASE}/storage/v1/object/public/catalog/products/chicharrones.webp` },
      priceGroup: {
        label: "Elige tu chicharrón",
        options: [
          { id: 10, label: "Pesca del día", priceCents: 4000 },
          { id: 11, label: "Calamar", priceCents: 4800 },
        ],
      },
      choiceGroups: [{ label: "Elige el tipo", options: ["A", "B"] }],
    });
  });
  it("con una sola opción se edita como precio normal", () => {
    const dish = rowToDish(row({ variants: [row().variants[0]!] }), URL_BASE);
    expect(dish.priceGroup).toBeNull();
    expect(dish.priceCents).toBe(4800);
  });
});

describe("toSavePayload", () => {
  it("conserva los ids de las opciones por nombre o, si se renombró, por posición", () => {
    const previous = rowToDish(row(), URL_BASE);
    const form = dishToForm(previous);
    form.priceGroup = {
      label: "Elige tu chicharrón",
      options: [
        { label: "Pescado del día", price: "39" }, // renombrada en la misma posición
        { label: "Calamar", price: "48" },
        { label: "Mixto", price: "42" }, // nueva
      ],
    };
    const payload = toSavePayload(1663, dishFormSchema.parse(form), previous, URL_BASE);
    expect(payload.variants).toEqual([
      { id: 10, label: "Pescado del día", price_cents: 3900 },
      { id: 11, label: "Calamar", price_cents: 4800 },
      { label: "Mixto", price_cents: 4200 },
    ]);
    expect(payload).toMatchObject({
      id: 1663,
      slug: "chicharrones",
      section_slug: "chicharrones",
      image_path: "products/chicharrones.webp",
      price_cents: 3900,
      variant_label: "Elige tu chicharrón",
      choice_groups: [{ key: "Elige el tipo", label: "Elige el tipo", options: ["A", "B"] }],
    });
  });

  it("un plato nuevo sin foto ni opciones", () => {
    const data = dishFormSchema.parse({
      ...dishToForm(rowToDish(row(), URL_BASE)),
      name: "Tacu Tacu",
      image: null,
      priceGroup: null,
      price: "45",
    });
    const payload = toSavePayload(null, data, null, URL_BASE);
    expect(payload).toMatchObject({
      id: null,
      slug: "tacu-tacu",
      image_path: null,
      price_cents: 4500,
      variants: [],
    });
  });
});
