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
 * - Sin definir: manda `DEMO_PANEL_BY_DEFAULT` (apagado: el sitio principal ya trabaja con datos
 *   reales); queda activo solo en las vistas previas de Vercel (`VERCEL_ENV=preview`).
 */
import type { StaffRole } from "@/features/staff/roles";

export const DEMO_COOKIE = "berypez_demo_role";

/**
 * Apagado desde el 22/11/2026: la carta y las promociones del panel ya escriben en Supabase y en
 * producción solo entran las cuentas reales (Administración y Recepción). Con el modo demo
 * encendido, quien entraba con «Administración» trabajaba sobre datos de ejemplo y lo que creaba
 * (p. ej. promociones) nunca llegaba a la web.
 */
export const DEMO_PANEL_BY_DEFAULT = false;

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
