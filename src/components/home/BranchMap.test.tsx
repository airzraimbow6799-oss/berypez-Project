import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isGoogleMapsEmbed } from "@/config/site";

import { BranchMap } from "./BranchMap";

const EMBED = "https://www.google.com/maps/embed?pb=!1m18!test";

type Aviso = (entries: Array<{ isIntersecting: boolean }>) => void;

describe("BranchMap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("carga el mapa solo cuando la persona se acerca con el scroll", () => {
    let avisar: Aviso = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: Aviso) {
          avisar = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    render(<BranchMap branchName="Lince" embedUrl={EMBED} />);
    expect(screen.queryByTitle("Mapa de la sede Lince")).toBeNull();

    act(() => avisar([{ isIntersecting: false }]));
    expect(screen.queryByTitle("Mapa de la sede Lince")).toBeNull();

    act(() => avisar([{ isIntersecting: true }]));
    expect(screen.getByTitle("Mapa de la sede Lince")).toHaveAttribute("src", EMBED);
    expect(disconnect).toHaveBeenCalled();
  });

  it("sin IntersectionObserver queda el botón para cargarlo a mano", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<BranchMap branchName="Lince" embedUrl={EMBED} />);
    expect(screen.queryByTitle("Mapa de la sede Lince")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /ver mapa de lince/i }));

    const iframe = screen.getByTitle("Mapa de la sede Lince");
    expect(iframe).toHaveAttribute("src", EMBED);
    expect(iframe).toHaveAttribute("loading", "lazy");
  });
});

describe("isGoogleMapsEmbed", () => {
  it("acepta solo el iframe oficial de Google Maps", () => {
    expect(isGoogleMapsEmbed(EMBED)).toBe(true);
    expect(isGoogleMapsEmbed(null)).toBe(false);
    expect(isGoogleMapsEmbed("https://maps.app.goo.gl/abc")).toBe(false);
    expect(isGoogleMapsEmbed("https://evil.example/maps/embed?pb=1")).toBe(false);
    expect(isGoogleMapsEmbed("javascript:alert(1)")).toBe(false);
  });
});
