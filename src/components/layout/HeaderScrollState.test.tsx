import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeaderScrollState } from "./HeaderScrollState";

describe("HeaderScrollState", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.scrollY = 0;
  });

  it("marca el encabezado al bajar y lo desmarca al volver arriba", () => {
    // Cuadro inmediato que devuelve 0: así el siguiente scroll pide otro cuadro.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const { container } = render(
      <header>
        <HeaderScrollState />
      </header>,
    );
    const header = container.querySelector("header")!;
    expect(header.dataset.scrolled).toBe("false");

    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header.dataset.scrolled).toBe("true");

    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header.dataset.scrolled).toBe("false");
  });
});
