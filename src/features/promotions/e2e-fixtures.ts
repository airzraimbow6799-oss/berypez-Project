import type { ProductPromotion } from "@/types/catalog";

/** Promociones de prueba para el catálogo snapshot con `E2E=1` (nunca en producción). */
export const E2E_PROMOTIONS: Readonly<Record<string, ProductPromotion>> = {
  "ceviche-berypez": {
    id: 9001,
    kind: "percent",
    percentOff: 20,
    priceCents: null,
    variantId: null,
    title: "Martes de ceviche",
    imageUrl: null,
    isFeatured: true,
    startsAt: null,
    endsAt: null,
  },
  chicharrones: {
    id: 9002,
    kind: "two_for_one",
    percentOff: null,
    priceCents: null,
    variantId: null,
    title: "Chicharrones 2×1",
    imageUrl: null,
    isFeatured: false,
    startsAt: null,
    endsAt: null,
  },
  "lomo-saltado": {
    id: 9003,
    kind: "fixed_price",
    percentOff: null,
    priceCents: 3900,
    variantId: null,
    title: "Lomo saltado a S/ 39",
    imageUrl: null,
    isFeatured: false,
    startsAt: null,
    endsAt: "2099-01-01T00:00:00Z",
  },
};
