/**
 * Roles del personal y qué secciones del panel puede ver cada uno (P0-01).
 *
 * Es la capa 1 de seguridad (la pantalla). La capa 3, la que de verdad protege los datos, son
 * las políticas RLS de Postgres: aquí solo se decide qué se muestra y a dónde se redirige.
 *
 * Dos roles (pedido del local, 22/11): **Administración** (la dueña: resumen, pedidos, reservas,
 * carta y personal) y **Recepción** (`salon`: lleva las reservas de la web, llamadas y WhatsApp).
 * No hay rol de cocina: la cocina trabaja con la ticketera de su sistema (Trinetsoft).
 *
 * En la base, el enum `staff_role` aún tiene `cocina` y no tiene `salon` (lo ajusta la tarea
 * B-R1). Un rol que no esté aquí no entra al panel (ver `isStaffRole` en session.ts).
 */

export const STAFF_ROLES = ["admin", "salon"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export type PanelSectionKey =
  "pedidos" | "reservas" | "carta" | "promociones" | "dashboard" | "personal";

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

/**
 * Secciones del panel, en el orden del menú. La primera permitida es a donde entra cada rol:
 * Administración entra a su Resumen; Recepción, a las Reservas.
 */
export const PANEL_SECTIONS: readonly PanelSection[] = [
  {
    key: "dashboard",
    href: "/panel/dashboard",
    label: "Resumen",
    roles: ["admin"],
    demoOnly: true,
  },
  { key: "pedidos", href: "/panel/pedidos", label: "Pedidos", roles: ["admin"] },
  { key: "reservas", href: "/panel/reservas", label: "Reservas", roles: ["admin", "salon"] },
  {
    key: "carta",
    href: "/panel/carta",
    label: "Carta",
    roles: ["admin"],
  },
  { key: "promociones", href: "/panel/promociones", label: "Promociones", roles: ["admin"] },
  {
    key: "personal",
    href: "/panel/personal",
    label: "Personal",
    roles: ["admin"],
    demoOnly: true,
  },
];

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administración",
  salon: "Recepción",
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
