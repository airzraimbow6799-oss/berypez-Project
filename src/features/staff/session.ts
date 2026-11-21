import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { canAccess, type PanelSectionKey, type StaffRole } from "./roles";

export type StaffSession = { email: string; role: StaffRole; branchId: number | null };

/** Personal con sesión válida, o null. getUser() valida el token con Supabase. */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: role } = await supabase
    .from("staff_roles")
    .select("role, branch_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!role) return null;
  return { email: data.user.email ?? "", role: role.role, branchId: role.branch_id };
}

/**
 * Exige personal con sesión, y con permiso para `section` si se indica.
 * Sin sesión → login. Con sesión pero sin permiso → página «sin acceso».
 * Se llama en el servidor al inicio de cada página o acción del panel.
 */
export async function requireStaff(section?: PanelSectionKey): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect("/panel/ingresar");
  if (section && !canAccess(session.role, section)) redirect("/panel/sin-acceso");
  return session;
}
