import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { type DishRow, rowToDish } from "./bridge";
import type { Dish } from "./schema";

const DISH_COLUMNS =
  "id, name, description, price_cents, variant_label, image_path, image_alt, tags, is_available, choice_groups, categories(name), product_menus(menu_slug), variants(id, label, price_cents, sort_order, is_archived)";

/** Platos publicados (los «eliminados» desde el panel quedan ocultos), por nombre. */
export async function listDishes(
  client: SupabaseClient<Database>,
  supabaseUrl: string,
): Promise<Dish[]> {
  const { data, error } = await client
    .from("products")
    .select(DISH_COLUMNS)
    .eq("is_published", true)
    .order("name");
  if (error) throw new Error(`No se pudo leer la carta: ${error.message}`);
  return (data as unknown as DishRow[]).map((row) => rowToDish(row, supabaseUrl));
}

export async function getDish(
  client: SupabaseClient<Database>,
  supabaseUrl: string,
  id: number,
): Promise<Dish | null> {
  const { data, error } = await client
    .from("products")
    .select(DISH_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el plato: ${error.message}`);
  return data ? rowToDish(data as unknown as DishRow, supabaseUrl) : null;
}
