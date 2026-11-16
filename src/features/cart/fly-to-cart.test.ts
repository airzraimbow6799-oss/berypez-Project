import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findVisibleCartLink, flyToCart, prefersReducedMotion, travel } from "./fly-to-cart";

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function cartLink(box: DOMRect): HTMLAnchorElement {
  const link = document.createElement("a");
  link.setAttribute("href", "/carrito");
  link.getBoundingClientRect = () => box;
  document.body.append(link);
  return link;
}

function origin(box: DOMRect): HTMLElement {
  const button = document.createElement("button");
  button.getBoundingClientRect = () => box;
  document.body.append(button);
  return button;
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof matchMedia;
}

describe("travel", () => {
  it("devuelve el desplazamiento entre los centros", () => {
    expect(travel(rect(0, 0, 40, 40), rect(100, 200, 20, 20))).toEqual({ x: 90, y: 190 });
  });

  it("puede ser negativo (el carrito está arriba o a la izquierda)", () => {
    expect(travel(rect(300, 400, 40, 40), rect(100, 0, 40, 40))).toEqual({ x: -200, y: -400 });
  });
});

describe("prefersReducedMotion", () => {
  it("lee la preferencia del sistema", () => {
    expect(
      prefersReducedMotion({ matchMedia: () => ({ matches: true }) } as unknown as Window),
    ).toBe(true);
    expect(
      prefersReducedMotion({ matchMedia: () => ({ matches: false }) } as unknown as Window),
    ).toBe(false);
  });

  it("si el navegador no la conoce, se asume que no hay preferencia", () => {
    expect(prefersReducedMotion({} as Window)).toBe(false);
  });
});

describe("findVisibleCartLink", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("ignora los carritos ocultos (sin tamaño) y devuelve el visible", () => {
    cartLink(rect(0, 0, 0, 0));
    const visible = cartLink(rect(10, 10, 48, 48));
    expect(findVisibleCartLink()).toBe(visible);
  });

  it("devuelve null si no hay ninguno visible", () => {
    cartLink(rect(0, 0, 0, 0));
    expect(findVisibleCartLink()).toBeNull();
  });
});

describe("flyToCart", () => {
  let animate: ReturnType<typeof vi.fn>;
  let listeners: Record<string, () => void>;

  beforeEach(() => {
    document.body.innerHTML = "";
    listeners = {};
    animate = vi.fn().mockReturnValue({
      addEventListener: (name: string, fn: () => void) => {
        listeners[name] = fn;
      },
    });
    HTMLElement.prototype.animate = animate as unknown as typeof HTMLElement.prototype.animate;
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no hace nada con «reducir movimiento»", () => {
    setReducedMotion(true);
    cartLink(rect(300, 10, 48, 48));
    flyToCart(origin(rect(0, 400, 44, 44)), "/foto.webp");
    expect(animate).not.toHaveBeenCalled();
    expect(document.body.querySelectorAll("div[aria-hidden]")).toHaveLength(0);
  });

  it("no hace nada sin elemento de origen o sin carrito visible", () => {
    flyToCart(null, "/foto.webp");
    flyToCart(origin(rect(0, 400, 44, 44)), "/foto.webp");
    expect(animate).not.toHaveBeenCalled();
  });

  it("no falla si el navegador no soporta la animación", () => {
    cartLink(rect(300, 10, 48, 48));
    (HTMLElement.prototype as unknown as { animate: unknown }).animate = undefined;
    expect(() => flyToCart(origin(rect(0, 400, 44, 44)), "/foto.webp")).not.toThrow();
  });

  it("crea el plato volador con la foto, lo anima hasta el carrito y lo retira al terminar", () => {
    cartLink(rect(300, 10, 48, 48));
    flyToCart(origin(rect(0, 400, 44, 44)), "/foto.webp");

    const volador = document.body.querySelector<HTMLElement>("div[aria-hidden='true']");
    expect(volador).not.toBeNull();
    expect(volador?.style.backgroundImage).toContain("/foto.webp");
    expect(volador?.style.pointerEvents).toBe("none");

    const [pasos, opciones] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(pasos).toHaveLength(3);
    // Llega al centro del carrito: (300+24) - (0+22) = 302 en x; (10+24) - (400+22) = -388 en y.
    expect(pasos[2]?.transform).toContain("translate(302px, -388px)");
    expect(opciones.duration).toBeGreaterThan(300);

    listeners["finish"]?.();
    expect(document.body.querySelector("div[aria-hidden='true']")).toBeNull();
  });

  it("sin foto sale un círculo ají y también se retira si la animación se cancela", () => {
    cartLink(rect(300, 10, 48, 48));
    flyToCart(origin(rect(0, 400, 44, 44)), null);

    const volador = document.body.querySelector<HTMLElement>("div[aria-hidden='true']");
    expect(volador?.style.backgroundImage).toBe("none");

    listeners["cancel"]?.();
    expect(document.body.querySelector("div[aria-hidden='true']")).toBeNull();
  });
});
