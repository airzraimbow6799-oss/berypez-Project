/**
 * F2-09 · El plato "vuela" hasta el carrito del encabezado al agregarlo.
 *
 * Es solo una ayuda visual: el carrito ya se actualizó y el aviso ya se mostró. Si algo falta
 * (no hay carrito visible, el navegador no soporta la API, la persona pidió menos movimiento),
 * no hace nada y no lanza errores.
 */

const DURATION_MS = 720;
const SIZE_PX = 56;

/** El botón del carrito que de verdad se ve (hay uno en el encabezado y puede haber otro en la barra móvil). */
export function findVisibleCartLink(doc: Document = document): HTMLElement | null {
  const links = doc.querySelectorAll<HTMLElement>('a[href="/carrito"]');
  for (const link of links) {
    const rect = link.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return link;
    }
  }
  return null;
}

export function prefersReducedMotion(win: Window = window): boolean {
  return win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Desplazamiento entre los centros de dos rectángulos. */
export function travel(from: DOMRect, to: DOMRect): { x: number; y: number } {
  return {
    x: to.left + to.width / 2 - (from.left + from.width / 2),
    y: to.top + to.height / 2 - (from.top + from.height / 2),
  };
}

/**
 * @param origin  Elemento desde donde sale (el botón «+» o «Agregar»).
 * @param imageUrl  Foto del plato. Sin foto sale un círculo ají.
 */
export function flyToCart(origin: Element | null, imageUrl?: string | null): void {
  if (typeof document === "undefined" || !origin || prefersReducedMotion()) {
    return;
  }
  const cart = findVisibleCartLink();
  if (!cart || typeof HTMLElement.prototype.animate !== "function") {
    return;
  }

  const from = origin.getBoundingClientRect();
  const { x, y } = travel(from, cart.getBoundingClientRect());

  const dish = document.createElement("div");
  dish.setAttribute("aria-hidden", "true");
  Object.assign(dish.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - SIZE_PX / 2}px`,
    top: `${from.top + from.height / 2 - SIZE_PX / 2}px`,
    width: `${SIZE_PX}px`,
    height: `${SIZE_PX}px`,
    borderRadius: "9999px",
    zIndex: "80",
    pointerEvents: "none",
    backgroundColor: "#f2b33d",
    backgroundImage: imageUrl ? `url("${imageUrl}")` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 10px 24px -8px rgba(8, 47, 73, 0.55)",
    border: "3px solid #fbf7f0",
  });
  document.body.append(dish);

  // Trayectoria en arco: sube un poco antes de caer al carrito.
  const animation = dish.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      {
        transform: `translate(${x * 0.5}px, ${y * 0.5 - 90}px) scale(0.85)`,
        opacity: 1,
        offset: 0.5,
      },
      { transform: `translate(${x}px, ${y}px) scale(0.2)`, opacity: 0.35 },
    ],
    { duration: DURATION_MS, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: "forwards" },
  );
  const cleanup = () => dish.remove();
  animation.addEventListener("finish", cleanup);
  animation.addEventListener("cancel", cleanup);
}
