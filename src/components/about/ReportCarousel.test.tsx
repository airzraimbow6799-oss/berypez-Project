import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { featuredReports } from "@/config/nosotros";

import { ReportCarousel } from "./ReportCarousel";

function conMovimiento(reducido: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: reducido }));
}

describe("ReportCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollBy = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("avanza solo cada 5 s y se puede pausar", () => {
    conMovimiento(false);
    render(<ReportCarousel videos={featuredReports()} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Reanudar" })).toBeInTheDocument();
  });

  it("con «reducir movimiento» no se mueve solo, pero las flechas funcionan", () => {
    conMovimiento(true);
    render(<ReportCarousel videos={featuredReports()} />);

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Pausar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reportaje siguiente" }));
    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);
  });

  it("al tocar un video deja de avanzar para no llevárselo", () => {
    conMovimiento(false);
    render(<ReportCarousel videos={featuredReports()} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Ver «/ })[0]!);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
  });
});
