import { afterEach, describe, expect, it, vi } from "vitest";

import { morphTo, PLATO_FOTO } from "./view-transition";

function ponerTransicion(fn: unknown) {
  Object.defineProperty(document, "startViewTransition", {
    value: fn,
    configurable: true,
    writable: true,
  });
}

describe("morphTo", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "startViewTransition");
    vi.unstubAllGlobals();
  });

  it("sin soporte del navegador solo hace el cambio", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const update = vi.fn();
    morphTo(document.createElement("img"), update);
    expect(update).toHaveBeenCalledOnce();
  });

  it("con «reducir movimiento» no anima, aunque el navegador pueda", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const start = vi.fn();
    ponerTransicion(start);
    const update = vi.fn();
    morphTo(document.createElement("img"), update);
    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
  });

  it("nombra la foto de origen y la libera dentro de la transición", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const foto = document.createElement("img");
    let nombreAlEmpezar = "";
    let callback: (() => void) | undefined;
    ponerTransicion((cb: () => void) => {
      nombreAlEmpezar = foto.style.viewTransitionName;
      callback = cb;
    });
    const update = vi.fn();

    morphTo(foto, update);
    expect(nombreAlEmpezar).toBe(PLATO_FOTO);
    callback?.();
    expect(foto.style.viewTransitionName).toBe("");
    expect(update).toHaveBeenCalledOnce();
  });
});
