/**
 * Modalidad del pedido y sede (F0-12 / F2-07). Se recuerda durante la sesión.
 * El valor guardado se valida: el almacenamiento del navegador puede venir
 * vacío, corrupto o bloqueado (modo privado).
 */

import { BRANCHES, type BranchInfo } from "@/config/site";

export type BranchSlug = BranchInfo["slug"];

export type OrderMode = { modality: "delivery" } | { modality: "pickup"; branch: BranchSlug };

export interface ModeOption {
  id: string;
  label: string;
  hint: string;
  mode: OrderMode;
}

const STORAGE_KEY = "berypez:modo-pedido";
/** Evento que avisa a toda la página que la modalidad cambió (cabecera, portada, carrito…). */
export const MODE_CHANGE_EVENT = "berypez:modo-pedido-cambio";

const BRANCH_SLUGS: readonly string[] = ["lince", "jesus-maria"];

/**
 * Validación a mano, sin Zod (#58): este módulo se carga en todas las páginas (cabecera y
 * portada) y Zod sumaba ~19–28 KB comprimidos solo para leer la modalidad guardada.
 */
function toMode(value: unknown): OrderMode | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  if (v.modality === "delivery") {
    return { modality: "delivery" };
  }
  if (v.modality === "pickup" && typeof v.branch === "string" && BRANCH_SLUGS.includes(v.branch)) {
    return { modality: "pickup", branch: v.branch as BranchSlug };
  }
  return null;
}

function branchName(slug: BranchSlug): string {
  return BRANCHES.find((b) => b.slug === slug)?.name ?? slug;
}

export const MODE_OPTIONS: readonly ModeOption[] = [
  {
    id: "delivery",
    label: "Delivery",
    hint: "Te lo llevamos a casa",
    mode: { modality: "delivery" },
  },
  ...BRANCHES.map((b): ModeOption => ({
    id: `pickup:${b.slug}`,
    label: `Recojo en ${b.name}`,
    hint: "Sin costo de envío",
    mode: { modality: "pickup", branch: b.slug },
  })),
];

export function modeId(mode: OrderMode): string {
  return mode.modality === "delivery" ? "delivery" : `pickup:${mode.branch}`;
}

export function modeLabel(mode: OrderMode): string {
  return mode.modality === "delivery" ? "Delivery" : `Recojo en ${branchName(mode.branch)}`;
}

export function parseMode(raw: string | null): OrderMode | null {
  if (!raw) {
    return null;
  }
  try {
    return toMode(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readStoredMode(storage: Storage | undefined): OrderMode | null {
  try {
    return parseMode(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writeStoredMode(storage: Storage | undefined, mode: OrderMode): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(mode));
  } catch {
    // Almacenamiento bloqueado: la elección vale solo para esta vista.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
  }
}
