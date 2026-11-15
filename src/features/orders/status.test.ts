import { describe, expect, it } from "vitest";

import { canTransition, nextStatuses, STATUS_LABELS, trackingSteps } from "./status";

describe("transiciones de estado", () => {
  it("delivery: recibido → en cocina → en camino → entregado", () => {
    expect(nextStatuses("pending", "delivery")).toEqual(["in_kitchen", "cancelled"]);
    expect(nextStatuses("in_kitchen", "delivery")).toEqual(["on_the_way", "cancelled"]);
    expect(nextStatuses("on_the_way", "delivery")).toEqual(["delivered"]);
    expect(nextStatuses("delivered", "delivery")).toEqual([]);
  });

  it("recojo: en cocina → listo para recoger → entregado", () => {
    expect(nextStatuses("in_kitchen", "pickup")).toEqual(["ready_for_pickup", "cancelled"]);
    expect(nextStatuses("ready_for_pickup", "pickup")).toEqual(["delivered"]);
  });

  it("no permite saltar pasos, retroceder ni usar el paso de la otra modalidad", () => {
    expect(canTransition("pending", "delivered", "delivery")).toBe(false);
    expect(canTransition("on_the_way", "in_kitchen", "delivery")).toBe(false);
    expect(canTransition("in_kitchen", "on_the_way", "pickup")).toBe(false);
    expect(canTransition("cancelled", "in_kitchen", "pickup")).toBe(false);
    expect(canTransition("received", "in_kitchen", "pickup")).toBe(true);
  });

  it("tiene rótulos en español para todos los estados", () => {
    expect(STATUS_LABELS.ready_for_pickup).toBe("Listo para recoger");
    expect(STATUS_LABELS.pending).toBe("Recibido");
  });

  it("arma la línea de tiempo según la modalidad", () => {
    expect(trackingSteps("pickup").map((s) => s.status)).toEqual([
      "received",
      "in_kitchen",
      "ready_for_pickup",
      "delivered",
    ]);
    expect(trackingSteps("delivery")[2]?.label).toBe("En camino");
  });
});
