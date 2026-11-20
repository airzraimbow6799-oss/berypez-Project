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

  it("QA-008: el navegador no pinta botones encima del video (imagen en imagen ni enviar)", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { container } = render(<HeroVideo />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("disablepictureinpicture");
    expect(video).toHaveAttribute("disableremoteplayback");
  });

  it("QA-008: el botón de pausa es discreto con mouse pero se alcanza con teclado", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<HeroVideo />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const boton = screen.getByRole("button", { name: /video/ });
    // Oculto solo en dispositivos con mouse; aparece al pasar sobre el video o con el foco.
    expect(boton.className).toContain("[@media(hover:hover)]:opacity-0");
    expect(boton.className).toContain("[@media(hover:hover)]:group-hover:opacity-100");
    expect(boton.className).toContain("[@media(hover:hover)]:focus-visible:opacity-100");
  });

  it("de fondo: llena su contenedor, pone la capa marino y la pausa arriba (no tapa el texto)", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { container } = render(
      <HeroVideo variant="fondo" overlayClassName="bg-gradient-to-t from-marino" />,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.firstElementChild).toHaveClass("absolute", "inset-0");
    expect(container.querySelector(".from-marino")).toHaveAttribute("aria-hidden", "true");
    // El contenedor del fondo sobresale 2.5 rem (parallax): la pausa baja eso más su margen.
    expect(screen.getByRole("button", { name: /video/ }).className).toContain("top-[3.25rem]");
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
