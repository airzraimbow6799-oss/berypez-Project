import type { ReactNode } from "react";

/**
 * Se vuelve a montar en cada navegación: la página nueva entra con un fundido corto
 * (.pagina-entra en motion.css). Solo después de una navegación interna (html[data-navegado]),
 * así la primera carga no se retrasa.
 */
export default function SiteTemplate({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="pagina-entra">{children}</div>;
}
