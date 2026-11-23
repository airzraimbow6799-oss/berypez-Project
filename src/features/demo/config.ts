/**
 * Modo demostración del panel.
 *
 * Deja entrar al panel con una cuenta simulada por rol y con datos de ejemplo, sin Supabase,
 * para enseñarlo a la dueña y para probar cada rol. NUNCA toca datos reales: la sesión demo
 * solo existe en una cookie y todos los datos viven en el navegador.
 *
 * Cuándo está activo:
 * - `DEMO_PANEL=1`: activo siempre (por ejemplo, en la demo pública o en local).
 * - `DEMO_PANEL=0`: apagado siempre.
 * - Sin definir: manda `DEMO_PANEL_BY_DEFAULT` (hoy activo, porque el sitio principal es la demo);
 *   si ese valor se apaga, queda activo solo en vistas previas de Vercel (`VERCEL_ENV=preview`).
 */
import type { StaffRole } from "@/features/staff/roles";

export const DEMO_COOKIE = "berypez_demo_role";

/**
 * Activo: a pedido de Axel el sitio sigue en modo demostración (botones «Entrar como
 * Administración / Recepción») hasta pasar a cuentas reales. Una sesión real, si existe, manda
 * sobre la de demostración (ver `getStaffSession`). Para apagarlo: `DEMO_PANEL=0` en Vercel o
 * cambiar esto a `false`.
 */
export const DEMO_PANEL_BY_DEFAULT = true;

export function isDemoPanel(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.DEMO_PANEL === "1") return true;
  if (env.DEMO_PANEL === "0") return false;
  return DEMO_PANEL_BY_DEFAULT || env.VERCEL_ENV === "preview";
}

export type DemoAccount = {
  role: StaffRole;
  email: string;
  /** Contraseña de mentira: solo existe en el modo demo y no abre nada real. */
  password: string;
  title: string;
  description: string;
};

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "admin",
    email: "admin@demo.berypez.pe",
    password: "demo1234",
    title: "Administración",
    description: "Entra a su resumen y ve todo: pedidos, reservas, carta y personal.",
  },
  {
    role: "salon",
    email: "recepcion@demo.berypez.pe",
    password: "demo1234",
    title: "Recepción",
    description:
      "Lleva las reservas de la web, las llamadas y WhatsApp. No ve la carta ni las ventas.",
  },
];

export function demoAccountForRole(role: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.role === role);
}

export function demoAccountForCredentials(
  email: string,
  password: string,
): DemoAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find(
    (account) => account.email === normalized && account.password === password,
  );
}
