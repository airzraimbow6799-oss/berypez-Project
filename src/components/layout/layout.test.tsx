import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartButton } from "./CartButton";
import { MobileNav } from "./MobileNav";
import { ModeSelector } from "./ModeSelector";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

vi.mock("next/navigation", () => ({ usePathname: () => "/carta/marina" }));

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SkipLink", () => {
  it("apunta al contenido principal", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute(
      "href",
      "#contenido",
    );
  });
});

describe("CartButton", () => {
  it("anuncia la cantidad de platos en español", () => {
    const { rerender } = render(<CartButton count={1} />);
    expect(screen.getByRole("link", { name: "Carrito, 1 plato" })).toBeInTheDocument();
    rerender(<CartButton count={3} />);
    expect(screen.getByRole("link", { name: "Carrito, 3 platos" })).toBeInTheDocument();
  });

  it("muestra 99+ cuando hay muchos platos", () => {
    render(<CartButton count={120} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});

describe("ModeSelector", () => {
  it("pide elegir cuando no hay modalidad guardada", () => {
    render(<ModeSelector />);
    expect(screen.getByRole("button", { name: /delivery o recojo/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("permite elegir recojo en una sede y lo recuerda en la sesión", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ModeSelector />);

    await user.click(screen.getByRole("button", { name: /delivery o recojo/i }));
    const panel = screen.getByRole("group", { name: "Cómo quieres recibir tu pedido" });
    await user.click(within(panel).getByRole("button", { name: /Recojo en Jesús María/ }));

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /Recojo en Jesús María/ });
    expect(trigger).toHaveFocus();

    unmount();
    render(<ModeSelector />);
    expect(await screen.findByRole("button", { name: /Recojo en Jesús María/ })).toBeVisible();
  });

  it("marca la opción elegida", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem("berypez:modo-pedido", '{"modality":"delivery"}');
    render(<ModeSelector />);

    await user.click(await screen.findByRole("button", { name: /^Delivery/ }));
    const panel = screen.getByRole("group");
    expect(within(panel).getByRole("button", { name: /Te lo llevamos/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("se cierra con Escape y devuelve el foco al botón", async () => {
    const user = userEvent.setup();
    render(<ModeSelector />);
    const trigger = screen.getByRole("button", { name: /delivery o recojo/i });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("se cierra al hacer clic fuera", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ModeSelector />
        <p>Afuera</p>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /delivery o recojo/i }));
    await user.click(screen.getByText("Afuera"));

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("funciona aunque el almacenamiento esté bloqueado", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<ModeSelector />);

    await user.click(screen.getByRole("button", { name: /delivery o recojo/i }));
    await user.click(screen.getByRole("button", { name: /Te lo llevamos/ }));

    expect(screen.getByRole("button", { name: /^Delivery/ })).toBeInTheDocument();
  });
});

describe("MobileNav", () => {
  it("muestra los accesos rápidos y marca la página actual", () => {
    render(<MobileNav whatsapp={null} />);
    const nav = screen.getByRole("navigation", { name: "Accesos rápidos" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Carta", "Buscar", "Carrito", "Reservar"]);
    expect(within(nav).getByRole("link", { name: "Carta" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("agrega WhatsApp en una pestaña nueva y segura cuando hay número", () => {
    render(<MobileNav whatsapp="51999999999" />);
    const link = screen.getByRole("link", { name: "WhatsApp" });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/51999999999?text="),
    );
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("SiteHeader y SiteFooter", () => {
  it("tienen navegación con nombre y enlaces a las 6 cartas y a los legales", () => {
    render(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
    const cartas = screen.getByRole("navigation", { name: "Cartas" });
    expect(within(cartas).getAllByRole("link")).toHaveLength(6);
    const legal = screen.getByRole("navigation", { name: "Legal" });
    expect(within(legal).getByRole("link", { name: "Libro de Reclamaciones" })).toHaveAttribute(
      "href",
      "/libro-de-reclamaciones",
    );
  });

  it("no muestra datos de sede pendientes (teléfonos vacíos)", () => {
    render(<SiteFooter />);
    expect(screen.queryByRole("link", { name: /^\d/ })).not.toBeInTheDocument();
    expect(screen.getByText("Lince")).toBeInTheDocument();
  });
});
