/**
 * Roles del personal y qué secciones del panel puede ver cada uno (P0-01).
 *
 * Es la capa 1 de seguridad (la pantalla). La capa 3, la que de verdad protege los datos, son
 * las políticas RLS de Postgres: aquí solo se decide qué se muestra y a dónde se redirige.
 *
 * `salon` aún no existe en el enum `staff_role` de la base (lo agrega la tarea B-R1): mientras
 * tanto la base solo devuelve `admin` y `cocina`, y este tipo ya está listo para el tercero.
 */

export const STAFF_ROLES = ["admin", "cocina", "salon"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type PanelSectionKey = "pedidos" | "reservas" | "carta";

export type PanelSection = {
  key: PanelSectionKey;
  href: string;
  label: string;
  roles: readonly StaffRole[];
  /**
   * Sección que por ahora solo funciona con datos de ejemplo (modo demostración). Se oculta
   * en el panel real hasta que tenga su backend (ver docs/plan/03-plan-de-trabajo.md).
   */
  demoOnly?: boolean;
};

/** Secciones del panel. Cada módulo nuevo (carta, plano, dashboard…) suma su entrada aquí. */
export const PANEL_SECTIONS: readonly PanelSection[] = [
  { key: "pedidos", href: "/panel", label: "Pedidos", roles: ["admin", "cocina", "salon"] },
  { key: "reservas", href: "/panel/reservas", label: "Reservas", roles: ["admin", "salon"] },
  {
    key: "carta",
    href: "/panel/carta",
    label: "Carta",
    roles: ["admin", "cocina"],
    demoOnly: true,
  },
];

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administración",
  cocina: "Cocina",
  salon: "Salón",
};

export function roleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}

/** Secciones que el rol puede ver, en el orden del menú. `demo` suma las que solo existen en la demostración. */
export function sectionsFor(role: StaffRole, demo = false): PanelSection[] {
  return PANEL_SECTIONS.filter(
    (section) => section.roles.includes(role) && (demo || !section.demoOnly),
  );
}

export function canAccess(role: StaffRole, key: PanelSectionKey, demo = false): boolean {
  return sectionsFor(role, demo).some((section) => section.key === key);
}

/** Primera sección permitida: a dónde mandar a quien no tiene acceso a la que pidió. */
export function homeFor(role: StaffRole, demo = false): PanelSection | undefined {
  return sectionsFor(role, demo)[0];
}
