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
 * - Sin definir: activo solo en vistas previas de Vercel (`VERCEL_ENV=preview`); en
 *   producción y en local queda apagado, así que un despliegue real nunca lo ofrece por accidente.
 */
import type { StaffRole } from "@/features/staff/roles";

export const DEMO_COOKIE = "berypez_demo_role";

export function isDemoPanel(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.DEMO_PANEL === "1") return true;
  if (env.DEMO_PANEL === "0") return false;
  return env.VERCEL_ENV === "preview";
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
    description: "Ve todo: pedidos, reservas, carta con precios y dashboard.",
  },
  {
    role: "cocina",
    email: "cocina@demo.berypez.pe",
    password: "demo1234",
    title: "Cocina",
    description: "Ve los pedidos y marca platos agotados. No cambia precios.",
  },
  {
    role: "salon",
    email: "salon@demo.berypez.pe",
    password: "demo1234",
    title: "Salón",
    description: "Ve los pedidos y las reservas. No ve la carta ni las ventas.",
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
