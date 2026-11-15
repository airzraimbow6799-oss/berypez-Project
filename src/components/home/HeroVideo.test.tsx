import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { canPlayMotion, HeroVideo } from "./HeroVideo";

function fakeWindow({ reduced = false, saveData = false, effectiveType = "4g" } = {}) {
  return {
    matchMedia: () => ({ matches: reduced }),
    navigator: { connection: { saveData, effectiveType } },
  } as unknown as Window;
}

describe("canPlayMotion", () => {
  it("permite el video en condiciones normales", () => {
    expect(canPlayMotion(fakeWindow())).toBe(true);
  });

  it("no carga el video si la persona prefiere menos movimiento", () => {
    expect(canPlayMotion(fakeWindow({ reduced: true }))).toBe(false);
  });

  it("no carga el video con ahorro de datos o conexión 2G", () => {
    expect(canPlayMotion(fakeWindow({ saveData: true }))).toBe(false);
    expect(canPlayMotion(fakeWindow({ effectiveType: "slow-2g" }))).toBe(false);
  });
});

describe("HeroVideo", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra el póster con texto alternativo y carga el video después", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { container } = render(<HeroVideo />);

    expect(screen.getByAltText(/Ilustración de Berypez/)).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.querySelector("video source")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Reproducir video" })).toBeInTheDocument();
  });

  it("con movimiento reducido deja solo el póster y no muestra controles", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { container } = render(<HeroVideo />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
