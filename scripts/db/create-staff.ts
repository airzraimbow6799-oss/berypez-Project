/**
 * F3-06 · Da de alta a una persona del personal en Supabase Auth y le asigna rol y sede.
 * La contraseña se genera aleatoria y se muestra UNA vez: compártela por un canal seguro.
 *
 * Uso: npm run staff:create -- <correo> <admin|cocina> [lince|jesus-maria]
 *      (admin sin sede = ve todas las sedes)
 */
import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../src/types/database";

async function main(): Promise<void> {
  const [email, role, branchSlug] = process.argv.slice(2);
  if (!email || (role !== "admin" && role !== "cocina")) {
    throw new Error("Uso: npm run staff:create -- <correo> <admin|cocina> [lince|jesus-maria]");
  }
  if (role === "cocina" && !branchSlug) {
    throw new Error("El rol cocina necesita sede: lince o jesus-maria.");
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SECRET_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let branchId: number | null = null;
  if (branchSlug) {
    const { data } = await supabase
      .from("branches")
      .select("id")
      .eq("slug", branchSlug)
      .maybeSingle();
    if (!data) throw new Error(`No existe la sede ${branchSlug}.`);
    branchId = data.id;
  }

  const password = randomBytes(12).toString("base64url");
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(error?.message ?? "No se creó el usuario.");

  const { error: roleError } = await supabase
    .from("staff_roles")
    .insert({ user_id: created.user.id, role, branch_id: branchId });
  if (roleError) throw new Error(roleError.message);

  process.stdout.write(
    `Personal creado: ${email} (${role}${branchSlug ? `, ${branchSlug}` : ", todas las sedes"}).\nContraseña temporal: ${password}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
