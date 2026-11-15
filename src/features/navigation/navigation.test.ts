import { describe, expect, it } from "vitest";

import { isPageNavigation } from "./navigation";

const here = new URL("https://berypez.pe/carta/marina?x=1");

function click(
  overrides: Partial<{
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    defaultPrevented: boolean;
  }> = {},
) {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  };
}

function anchor(href: string, attrs: Partial<{ target: string; download: boolean }> = {}) {
  return {
    href: new URL(href, here).href,
    target: attrs.target ?? "",
    hasDownload: attrs.download ?? false,
  };
}

describe("isPageNavigation", () => {
  it("detecta un enlace interno a otra página", () => {
    expect(isPageNavigation(click(), anchor("/reservas"), here)).toBe(true);
    expect(isPageNavigation(click(), anchor("/carta/criolla"), here)).toBe(true);
  });

  it("considera navegación un cambio de búsqueda en la misma ruta", () => {
    expect(isPageNavigation(click(), anchor("/carta/marina?x=2"), here)).toBe(true);
  });

  it.each([
    ["un ancla de la misma página", click(), anchor("#ceviches")],
    ["la misma URL", click(), anchor("/carta/marina?x=1")],
    ["un enlace externo", click(), anchor("https://wa.me/51999999999")],
    ["una pestaña nueva", click(), anchor("/reservas", { target: "_blank" })],
    ["una descarga", click(), anchor("/carta.pdf", { download: true })],
    ["Ctrl + clic", click({ ctrlKey: true }), anchor("/reservas")],
    ["Cmd + clic", click({ metaKey: true }), anchor("/reservas")],
    ["Shift + clic", click({ shiftKey: true }), anchor("/reservas")],
    ["clic central", click({ button: 1 }), anchor("/reservas")],
    ["un clic ya cancelado", click({ defaultPrevented: true }), anchor("/reservas")],
    ["un enlace tel:", click(), anchor("tel:+51999999999")],
  ])("no muestra el loader con %s", (_name, event, link) => {
    expect(isPageNavigation(event, link, here)).toBe(false);
  });
});
