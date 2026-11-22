import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { imagePathFromUrl, publicImageUrl } from "@/features/carta/bridge";
import type { Database } from "@/types/database";

import type { Promotion, PromotionData } from "./schema";

type Row = Database["public"]["Tables"]["promotions"]["Row"];

export function rowToPromotion(row: Row, supabaseUrl: string): Promotion {
  return {
    id: row.id,
    dishId: row.product_id,
    kind: row.kind,
    percentOff: row.percent_off,
    priceCents: row.price_cents,
    variantId: row.variant_id,
    title: row.title,
    image: row.image_path
      ? { url: publicImageUrl(supabaseUrl, row.image_path), alt: row.title }
      : null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

export function promotionToRow(data: PromotionData, supabaseUrl: string) {
  return {
    product_id: data.dishId,
    kind: data.kind,
    percent_off: data.percentOff,
    price_cents: data.priceCents,
    variant_id: data.variantId,
    title: data.title,
    image_path: data.image ? imagePathFromUrl(supabaseUrl, data.image.url) : null,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    is_active: data.isActive,
    is_featured: data.isFeatured,
  };
}

/** Todas las promociones (Administración las ve por RLS), las más nuevas primero. */
export async function listPromotions(
  client: SupabaseClient<Database>,
  supabaseUrl: string,
): Promise<Promotion[]> {
  const { data, error } = await client
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudo leer las promociones: ${error.message}`);
  return data.map((row) => rowToPromotion(row, supabaseUrl));
}
