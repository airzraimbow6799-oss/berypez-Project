import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MIN_VISIBLE_MS, NavigationLoader, SHOW_DELAY_MS } from "./NavigationLoader";

const nav = vi.hoisted(() => ({ pathname: "/", search: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.search,
}));

function renderWithLink() {
  return render(
    <>
      <a href="/reservas">Reservas</a>
      <a href="#seccion">Ancla</a>
      <NavigationLoader />
    </>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  nav.pathname = "/";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NavigationLoader", () => {
  it("muestra los peces si la página nueva tarda y los retira al llegar", () => {
    const { rerender } = renderWithLink();
    expect(screen.queryByRole("status")).toBeNull();

    act(() => {
      screen.getByText("Reservas").click();
      vi.advanceTimersByTime(SHOW_DELAY_MS + 10);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Abriendo la página");

    nav.pathname = "/reservas";
    rerender(
      <>
        <a href="/reservas">Reservas</a>
        <NavigationLoader />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(MIN_VISIBLE_MS);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("no aparece si la página llega antes del retraso (sin parpadeo)", () => {
    const { rerender } = renderWithLink();
    act(() => {
      screen.getByText("Reservas").click();
      vi.advanceTimersByTime(50);
    });
    nav.pathname = "/reservas";
    rerender(<NavigationLoader />);
    act(() => {
      vi.advanceTimersByTime(SHOW_DELAY_MS * 3);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("ignora las anclas de la misma página", () => {
    renderWithLink();
    act(() => {
      screen.getByText("Ancla").click();
      vi.advanceTimersByTime(SHOW_DELAY_MS * 3);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
