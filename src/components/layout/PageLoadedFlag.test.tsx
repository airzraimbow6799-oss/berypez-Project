import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PageLoadedFlag } from "./PageLoadedFlag";

describe("PageLoadedFlag", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset.cargado;
  });

  it("marca <html data-cargado> recién cuando la página terminó de cargar", () => {
    vi.useFakeTimers();
    render(<PageLoadedFlag />);
    // jsdom ya está «complete» y no tiene requestIdleCallback: se marca tras una pausa corta.
    expect(document.documentElement.dataset.cargado).toBeUndefined();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(document.documentElement.dataset.cargado).toBe("true");
  });
});
