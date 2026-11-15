/** Datos mínimos del clic y del enlace (independientes del DOM para poder probarlos). */
export type ClickInfo = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

export type AnchorInfo = { href: string; target: string; hasDownload: boolean };

/**
 * ¿Este clic lleva a otra página del mismo sitio en la misma pestaña? Solo entonces se
 * muestra el loader de los peces.
 */
export function isPageNavigation(click: ClickInfo, anchor: AnchorInfo, current: URL): boolean {
  if (
    click.defaultPrevented ||
    click.button !== 0 ||
    click.metaKey ||
    click.ctrlKey ||
    click.shiftKey ||
    click.altKey ||
    anchor.hasDownload ||
    (anchor.target !== "" && anchor.target !== "_self")
  ) {
    return false;
  }

  let target: URL;
  try {
    target = new URL(anchor.href);
  } catch {
    return false;
  }

  if (target.origin !== current.origin) {
    return false;
  }
  return target.pathname !== current.pathname || target.search !== current.search;
}
