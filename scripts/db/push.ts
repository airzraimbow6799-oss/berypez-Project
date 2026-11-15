/**
 * Aplica en Supabase las migraciones de `supabase/migrations` que aún no se aplicaron.
 * Usa la Management API (no necesita Docker ni la contraseña de la base) y deja cada
 * migración registrada en el historial de Supabase, igual que `supabase db push`.
 *
 * Uso: npm run db:push            (aplica)
 *      npm run db:push -- --dry   (solo muestra qué aplicaría)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { managementApi, runSql } from "./management-api";

const MIGRATIONS_DIR = path.resolve("supabase/migrations");
const FILE_PATTERN = /^(\d{14})_([a-z0-9_]+)\.sql$/;

type RemoteMigration = { version: string; name?: string };

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry");
  const remote = await managementApi<RemoteMigration[]>("/database/migrations");
  const appliedVersions = new Set(remote.map((m) => m.version));
  const appliedNames = new Set(remote.map((m) => m.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => FILE_PATTERN.test(f)).sort();
  const pending = files.filter((f) => {
    const [, version, name] = FILE_PATTERN.exec(f) ?? [];
    return !appliedVersions.has(version ?? "") && !appliedNames.has(name);
  });

  if (pending.length === 0) {
    process.stdout.write("La base ya está al día.\n");
    return;
  }

  for (const file of pending) {
    const [, version, name] = FILE_PATTERN.exec(file) ?? [];
    if (dryRun) {
      process.stdout.write(`Pendiente: ${file}\n`);
      continue;
    }
    const query = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    // Secuencial a propósito: cada migración depende de las anteriores.
    await managementApi("/database/migrations", {
      method: "POST",
      body: JSON.stringify({ query, name }),
    });
    // La API registra la migración con su propia marca de tiempo: se alinea con el
    // nombre del archivo para que la CLI de Supabase vea el mismo historial.
    await runSql(
      `update supabase_migrations.schema_migrations set version = '${version}'
       where name = '${name}' and version <> '${version}'`,
    );
    process.stdout.write(`Aplicada: ${file}\n`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
