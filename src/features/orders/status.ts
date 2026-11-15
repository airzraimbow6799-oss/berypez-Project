/** F3-04 · Estados del pedido y transiciones permitidas para el personal. */

export const ORDER_STATUSES = [
  "pending",
  "received",
  "in_kitchen",
  "on_the_way",
  "ready_for_pickup",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Modality = "delivery" | "pickup";

export const STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  pending: "Recibido",
  received: "Recibido",
  in_kitchen: "En cocina",
  on_the_way: "En camino",
  ready_for_pickup: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const FLOW: Readonly<Record<Modality, readonly OrderStatus[]>> = {
  delivery: ["received", "in_kitchen", "on_the_way", "delivered"],
  pickup: ["received", "in_kitchen", "ready_for_pickup", "delivered"],
};

/** “pending” (recién creado) equivale a “recibido”. */
const normalize = (status: OrderStatus): OrderStatus =>
  status === "pending" ? "received" : status;

/** Próximos estados válidos: el siguiente paso y, antes de salir, cancelar. */
export function nextStatuses(current: OrderStatus, modality: Modality): OrderStatus[] {
  const flow = FLOW[modality];
  const index = flow.indexOf(normalize(current));
  if (index === -1 || index === flow.length - 1) return [];
  const next = flow[index + 1];
  const canCancel = index <= 1;
  return [...(next ? [next] : []), ...(canCancel ? (["cancelled"] as const) : [])];
}

export function canTransition(from: OrderStatus, to: OrderStatus, modality: Modality): boolean {
  return nextStatuses(from, modality).includes(to);
}

export function trackingSteps(modality: Modality) {
  return FLOW[modality].map((status) => ({ status, label: STATUS_LABELS[status] }));
}
