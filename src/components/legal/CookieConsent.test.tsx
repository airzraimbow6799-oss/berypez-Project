import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CookieConsent } from "./CookieConsent";

describe("CookieConsent (QA-007)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // jsdom no implementa ResizeObserver: se simula y se informa un alto fijo del aviso.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      height: 180,
    } as DOMRect);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("el enlace dice de qué trata (no solo «Más información»)", async () => {
    render(<CookieConsent />);
    const enlace = await screen.findByRole("link", { name: "Más información sobre cookies" });
    expect(enlace).toHaveAttribute("href", "/privacidad");
  });

  it("reserva al final de la página el alto del aviso para que no tape el pie", async () => {
    const { container } = render(<CookieConsent />);
    await screen.findByRole("region", { name: "Cookies" });
    const espacio = container.querySelector('div[aria-hidden="true"]');
    expect(espacio).toHaveStyle({ height: "196px" });
  });

  it("al decidir, desaparecen el aviso y el espacio reservado", async () => {
    const user = userEvent.setup();
    const { container } = render(<CookieConsent />);
    await user.click(await screen.findByRole("button", { name: "Solo necesarias" }));
    expect(screen.queryByRole("region", { name: "Cookies" })).toBeNull();
    expect(container.querySelector('div[aria-hidden="true"]')).toBeNull();
  });
});
