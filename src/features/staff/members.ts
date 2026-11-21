import { z } from "zod";

import type { StaffRole } from "./roles";

/**
 * Personal del restaurante (módulo 1): reglas para invitar, cambiar rol y desactivar.
 * Hoy se usa con datos de ejemplo; el backend real (B-R1) aplica las mismas reglas.
 */

export type MemberBranch = "Lince" | "Jesús María";

export type Member = {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  /** null = todas las sedes (solo administración). */
  branch: MemberBranch | null;
  isActive: boolean;
  /** Invitación enviada que aún no se acepta. */
  isPending: boolean;
};

export const ROLE_OPTIONS: ReadonlyArray<{ value: StaffRole; label: string }> = [
  { value: "admin", label: "Administración" },
  { value: "cocina", label: "Cocina" },
  { value: "salon", label: "Salón" },
];

const isActiveAdmin = (m: Member) => m.role === "admin" && m.isActive;

export type ChangeResult = { ok: true } | { ok: false; message: string };

/**
 * ¿Se puede aplicar el cambio? Siempre debe quedar al menos una persona de administración
 * activa; si no, nadie podría volver a entrar a gestionar el personal.
 */
export function canChange(
  members: readonly Member[],
  id: number,
  change: { role?: StaffRole; isActive?: boolean },
): ChangeResult {
  const target = members.find((m) => m.id === id);
  if (!target) return { ok: false, message: "No se encontró a esa persona." };
  const losesAdmin =
    isActiveAdmin(target) &&
    ((change.role !== undefined && change.role !== "admin") || change.isActive === false);
  if (losesAdmin && members.filter(isActiveAdmin).length <= 1) {
    return { ok: false, message: "Debe quedar al menos una persona de administración activa." };
  }
  return { ok: true };
}

export const inviteSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe el nombre.").max(80, "El nombre es muy largo."),
    email: z.email("El correo no es válido.").max(254, "El correo es muy largo."),
    role: z.enum(["admin", "cocina", "salon"], { error: "Elige el rol." }),
    branch: z.enum(["", "Lince", "Jesús María"]),
  })
  .refine((v) => v.role === "admin" || v.branch !== "", {
    path: ["branch"],
    message: "Cocina y salón trabajan en una sede: elígela.",
  });
export type InviteInput = z.input<typeof inviteSchema>;
export type Invite = z.output<typeof inviteSchema>;

/** ¿Ya existe alguien con ese correo? (sin importar mayúsculas) */
export function emailTaken(members: readonly Member[], email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return members.some((m) => m.email.toLowerCase() === normalized);
}
