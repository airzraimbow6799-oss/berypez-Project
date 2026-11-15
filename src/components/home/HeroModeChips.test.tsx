import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { writeStoredMode } from "@/features/order-mode/mode";

import { chipsFor, HeroModeChips } from "./HeroModeChips";

const texts = (mode: Parameters<typeof chipsFor>[0]) => chipsFor(mode).map((c) => c.text);

describe("chipsFor", () => {
  it("sin elección muestra delivery y recojo", () => {
    expect(texts(null)).toEqual([
      "Delivery desde S/ 7.50",
      "Recojo en Lince o Jesús María",
      "Yape, Plin y tarjeta",
    ]);
  });

  it("con delivery no ofrece recojo", () => {
    expect(texts({ modality: "delivery" })).toEqual([
      "Delivery desde S/ 7.50",
      "Yape, Plin y tarjeta",
    ]);
  });

  it("con recojo no menciona delivery y muestra la dirección de la sede", () => {
    const result = texts({ modality: "pickup", branch: "jesus-maria" });
    expect(result).toEqual([
      "Recojo en Jesús María, sin costo de envío",
      "Av. Máximo Abril 592",
      "Yape, Plin y tarjeta",
    ]);
    expect(result.join(" ")).not.toMatch(/delivery/i);
  });
});

describe("HeroModeChips", () => {
  afterEach(() => window.sessionStorage.clear());

  it("se actualiza al instante cuando la cabecera cambia la modalidad", () => {
    render(<HeroModeChips />);
    expect(screen.getByText("Delivery desde S/ 7.50")).toBeInTheDocument();

    act(() => writeStoredMode(window.sessionStorage, { modality: "pickup", branch: "lince" }));

    expect(screen.getByText("Recojo en Lince, sin costo de envío")).toBeInTheDocument();
    expect(screen.queryByText(/Delivery desde/)).toBeNull();
  });
});
