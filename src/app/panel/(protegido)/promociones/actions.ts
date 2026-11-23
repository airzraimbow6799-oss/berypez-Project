"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { listDishes } from "@/features/carta/server";
import { canFeature, normalizeFeatured } from "@/features/promotions/featured";
import { CATALOG_TAG } from "@/features/catalog/data/cached";
import {
  parsePromotionForm,
  type Promotion,
  type PromotionFormInput,
} from "@/features/promotions/schema";
import { listPromotions, promotionToRow } from "@/features/promotions/server";
import { getStaffSession } from "@/features/staff/session";
import { readPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de Promociones (sesión REAL de Administración). La base vuelve a exigir el rol
 * por RLS. Cada cambio refresca la caché de la carta: precios, franja y ventana emergente.
 */

export type PromotionsResult =
  | { ok: true; promotions: Promotion[] }
  | { ok: false; message: string; errors?: Record<string, string> };

const NOT_ALLOWED = "Solo Administración puede cambiar las promociones.";
const FAILED = "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
const idSchema = z.number().int().positive();

async function adminClient() {
  const session = await getStaffSession();
  if (!session || session.isDemo || session.role !== "admin") return null;
  return createClient();
}

async function done(client: Awaited<ReturnType<typeof createClient>>): Promise<PromotionsResult> {
  revalidateTag(CATALOG_TAG);
  return {
    ok: true,
    promotions: await listPromotions(client, readPublicEnv().NEXT_PUBLIC_SUPABASE_URL),
  };
}

export async function savePromotion(
  id: number | null,
  input: PromotionFormInput,
): Promise<PromotionsResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, message: FAILED };

  const supabaseUrl = readPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  const parsed = parsePromotionForm(input, await listDishes(client, supabaseUrl));
  if (!parsed.ok) {
    return { ok: false, message: "Revisa los campos marcados.", errors: parsed.errors };
  }
  // Una sola destacada y solo si queda activa hoy (src/features/promotions/featured.ts).
  const data = normalizeFeatured(parsed.data, Date.now());
  const row = promotionToRow(data, supabaseUrl);
  if (data.isFeatured) {
    const others = client.from("promotions").update({ is_featured: false }).eq("is_featured", true);
    const { error: unfeatureError } = await (id === null ? others : others.neq("id", id));
    if (unfeatureError) return { ok: false, message: FAILED };
  }
  const { error } =
    id === null
      ? await client.from("promotions").insert(row)
      : await client.from("promotions").update(row).eq("id", id);
  return error ? { ok: false, message: FAILED } : done(client);
}

export async function setPromotionFlag(
  id: number,
  flag: "isActive" | "isFeatured",
  value: boolean,
): Promise<PromotionsResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (!idSchema.safeParse(id).success) return { ok: false, message: FAILED };
  if (flag === "isFeatured" && value) {
    // Solo se destaca una promoción activa hoy, y al hacerlo la anterior deja de serlo.
    const current = await listPromotions(client, readPublicEnv().NEXT_PUBLIC_SUPABASE_URL);
    const target = current.find((p) => p.id === id);
    if (!target || !canFeature(target, Date.now())) {
      return { ok: false, message: "Solo se puede destacar una promoción activa." };
    }
    const { error: unfeatureError } = await client
      .from("promotions")
      .update({ is_featured: false })
      .eq("is_featured", true)
      .neq("id", id);
    if (unfeatureError) return { ok: false, message: FAILED };
  }
  // Pausar también quita la estrella: una promoción pausada no sale en la ventana.
  const patch =
    flag === "isActive"
      ? { is_active: value === true, ...(value ? {} : { is_featured: false }) }
      : { is_featured: value === true };
  const { error } = await client.from("promotions").update(patch).eq("id", id);
  return error ? { ok: false, message: FAILED } : done(client);
}

export async function deletePromotion(id: number): Promise<PromotionsResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (!idSchema.safeParse(id).success) return { ok: false, message: FAILED };
  const { error } = await client.from("promotions").delete().eq("id", id);
  return error ? { ok: false, message: FAILED } : done(client);
}
