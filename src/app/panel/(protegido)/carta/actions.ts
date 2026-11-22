"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { CATALOG_BUCKET, publicImageUrl, toSavePayload } from "@/features/carta/bridge";
import { dishFormSchema, type DishFormInput, formErrors, type Dish } from "@/features/carta/schema";
import { getDish, listDishes } from "@/features/carta/server";
import { CATALOG_TAG } from "@/features/catalog/data/cached";
import { getStaffSession } from "@/features/staff/session";
import { readPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

/**
 * Acciones de la carta real (B-R2). Cada una vuelve a comprobar en el servidor que quien llama
 * es Administración con sesión REAL: las cuentas del modo demostración nunca tocan la base.
 * La base vuelve a exigir el rol dentro de cada función (defensa en profundidad).
 */

export type CartaResult =
  { ok: true; dishes: Dish[] } | { ok: false; message: string; errors?: Record<string, string> };

const NOT_ALLOWED = "Solo Administración puede cambiar la carta.";
const FAILED = "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";

/** Fotos ya comprimidas en el navegador: el bucket acepta WebP/JPEG de hasta 300 KB. */
const PHOTO_TYPES = ["image/webp", "image/jpeg"];
const MAX_PHOTO_BYTES = 300_000;

const idSchema = z.number().int().positive();

async function adminClient() {
  const session = await getStaffSession();
  if (!session || session.isDemo || session.role !== "admin") return null;
  return createClient();
}

async function done(client: Awaited<ReturnType<typeof createClient>>): Promise<CartaResult> {
  // La web pública lee la carta desde caché: se refresca al instante (el webhook es respaldo).
  revalidateTag(CATALOG_TAG);
  return { ok: true, dishes: await listDishes(client, readPublicEnv().NEXT_PUBLIC_SUPABASE_URL) };
}

export async function saveDish(id: number | null, input: DishFormInput): Promise<CartaResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, message: FAILED };

  const parsed = dishFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      errors: formErrors(parsed.error.issues),
    };
  }

  const supabaseUrl = readPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  const previous = id === null ? null : await getDish(client, supabaseUrl, id);
  if (id !== null && !previous) return { ok: false, message: "Ese plato ya no existe." };

  const payload = toSavePayload(id, parsed.data, previous, supabaseUrl);
  const { error } = await client.rpc("admin_save_product", { p: payload as unknown as Json });
  if (error) return { ok: false, message: FAILED };
  return done(client);
}

export async function setDishAvailable(id: number, isAvailable: boolean): Promise<CartaResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (!idSchema.safeParse(id).success) return { ok: false, message: FAILED };
  const { error } = await client.rpc("admin_set_product_available", {
    p_id: id,
    p_available: isAvailable === true,
  });
  return error ? { ok: false, message: FAILED } : done(client);
}

export async function setDishPrice(id: number, priceCents: number): Promise<CartaResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  const valid = z.number().int().positive().max(99_900).safeParse(priceCents);
  if (!idSchema.safeParse(id).success || !valid.success) return { ok: false, message: FAILED };
  const { error } = await client.rpc("admin_set_product_price", {
    p_id: id,
    p_price_cents: valid.data,
  });
  return error ? { ok: false, message: FAILED } : done(client);
}

export async function removeDish(id: number): Promise<CartaResult> {
  const client = await adminClient();
  if (!client) return { ok: false, message: NOT_ALLOWED };
  if (!idSchema.safeParse(id).success) return { ok: false, message: FAILED };
  const { error } = await client.rpc("admin_unpublish_product", { p_id: id });
  return error ? { ok: false, message: FAILED } : done(client);
}

export type PhotoResult = { ok: true; url: string } | { ok: false; message: string };

/** Sube la foto (ya comprimida a WebP en el navegador) al bucket público de la carta. */
export async function uploadDishPhoto(form: FormData): Promise<PhotoResult> {
  if (!(await adminClient())) return { ok: false, message: NOT_ALLOWED };
  const file = form.get("photo");
  if (!(file instanceof File) || !PHOTO_TYPES.includes(file.type)) {
    return { ok: false, message: "La foto debe ser una imagen WEBP o JPG." };
  }
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return { ok: false, message: "La foto pesa demasiado. Prueba con otra." };
  }
  const extension = file.type === "image/webp" ? "webp" : "jpg";
  const path = `products/panel/${crypto.randomUUID()}.${extension}`;
  const { error } = await createServiceClient()
    .storage.from(CATALOG_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, message: "No se pudo subir la foto. Inténtalo de nuevo." };
  return { ok: true, url: publicImageUrl(readPublicEnv().NEXT_PUBLIC_SUPABASE_URL, path) };
}
