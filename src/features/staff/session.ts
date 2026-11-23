import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { DEMO_COOKIE, demoAccountForRole, isDemoPanel } from "@/features/demo/config";
import { createClient } from "@/lib/supabase/server";

import { canAccess, isStaffRole, type PanelSectionKey, type StaffRole } from "./roles";

export type StaffSession = {
  email: string;
  role: StaffRole;
  branchId: number | null;
  /** true: sesión simulada del modo demostración (sin Supabase, solo datos de ejemplo). */
  isDemo: boolean;
};

/** Sesión simulada: solo si el modo demo está activo y hay cookie con un rol válido. */
async function getDemoSession(): Promise<StaffSession | null> {
  if (!isDemoPanel()) return null;
  const role = (await cookies()).get(DEMO_COOKIE)?.value;
  const account = role ? demoAccountForRole(role) : undefined;
  if (!account) return null;
  return { email: account.email, role: account.role, branchId: null, isDemo: true };
}

/**
 * Personal con sesión válida, o null. La sesión REAL manda: si en el navegador quedó la cookie
 * de demostración y la persona entra con su cuenta, se trabaja con datos reales.
 */
// `cache` de React: dentro de una misma petición el layout y la página comparten el resultado,
// en vez de preguntar a Supabase (usuario + rol) dos o tres veces antes de pintar.
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  return (await getRealSession()) ?? (await getDemoSession());
});

/** Sesión de Supabase con rol de personal. getUser() valida el token con Supabase. */
async function getRealSession(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: role } = await supabase
    .from("staff_roles")
    .select("role, branch_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  // Un rol que el panel ya no usa (p. ej. `cocina`, que sigue en el enum hasta B-R1) no entra.
  if (!role || !isStaffRole(role.role)) return null;
  return {
    email: data.user.email ?? "",
    role: role.role,
    branchId: role.branch_id,
    isDemo: false,
  };
}

/**
 * Exige personal con sesión, y con permiso para `section` si se indica.
 * Sin sesión → login. Con sesión pero sin permiso → página «sin acceso».
 * Se llama en el servidor al inicio de cada página o acción del panel.
 */
export async function requireStaff(section?: PanelSectionKey): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect("/panel/ingresar");
  if (section && !canAccess(session.role, section, session.isDemo)) redirect("/panel/sin-acceso");
  return session;
}
