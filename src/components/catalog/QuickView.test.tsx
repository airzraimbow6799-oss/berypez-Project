import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import catalog from "../../../data/catalog/catalog.json";
import type { Product } from "@/types/catalog";

import { QuickView } from "./QuickView";

const plato = (catalog as { products: Product[] }).products.find(
  (p) => p.slug === "tequenos-de-queso-6-unid",
)!;

// jsdom no implementa <dialog>.showModal(): se emula lo mínimo.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("QuickView · foto", () => {
  it("muestra al instante la foto que ya tenía la tarjeta y pide la grande con prioridad", () => {
    const { container } = render(
      <QuickView
        product={plato}
        previewSrc="/_next/image?url=%2Fcatalog%2Fx.webp&w=320&q=75"
        onClose={() => {}}
      />,
    );

    const previa = container.querySelector('img[aria-hidden="true"]');
    expect(previa).toHaveAttribute("src", "/_next/image?url=%2Fcatalog%2Fx.webp&w=320&q=75");

    const grande = screen.getByRole("img", { name: plato.image!.alt });
    // priority: next/image no la deja en lazy (esperar «a que se necesite» era lo que demoraba).
    expect(grande).not.toHaveAttribute("loading", "lazy");
  });

  it("sin foto previa muestra solo la grande", () => {
    const { container } = render(<QuickView product={plato} onClose={() => {}} />);
    expect(container.querySelector('img[aria-hidden="true"]')).toBeNull();
    expect(screen.getByRole("img", { name: plato.image!.alt })).toBeInTheDocument();
  });
});
