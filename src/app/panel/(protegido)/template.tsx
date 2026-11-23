import type { ReactNode } from "react";

/**
 * Se vuelve a montar al cambiar de sección del panel: el contenido nuevo entra deslizándose
 * (.panel-entra en motion.css) mientras el menú queda quieto. Reemplaza a la pantalla de carga,
 * que hacía «parpadear» el panel; mientras llega la sección, la pestaña elegida muestra que está
 * cargando (PanelTabPending). overflow-x-clip: el deslizamiento no abre scroll lateral.
 */
export default function PanelTemplate({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="panel-entra overflow-x-clip">{children}</div>;
}
