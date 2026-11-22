import type { Product } from "@/types/catalog";

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;

/**
 * Eventos de GA4 de las promociones (nombres recomendados por Google: así salen en el informe
 * de promociones). Solo se envían si la persona aceptó la analítica: sin eso `gtag` no existe.
 */
export function trackPromotion(event: "view_promotion" | "select_promotion", product: Product) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  const promo = product.promotion;
  if (!gtag || !promo) return;
  gtag("event", event, {
    promotion_id: String(promo.id),
    promotion_name: promo.title,
    creative_slot: "ventana-inicio",
    items: [{ item_id: String(product.id), item_name: product.name }],
  });
}
