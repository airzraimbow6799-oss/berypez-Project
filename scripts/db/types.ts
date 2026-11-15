/**
 * Genera `src/types/database.ts` desde el esquema real de Supabase (Management API).
 * Equivale a `supabase gen types typescript --linked`. Uso: npm run db:types
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { managementApi } from "./management-api";

const OUT_FILE = path.resolve("src/types/database.ts");

async function main(): Promise<void> {
  const { types } = await managementApi<{ types: string }>(
    "/types/typescript?included_schemas=public",
  );
  await writeFile(OUT_FILE, types, "utf8");
  process.stdout.write(`Tipos generados en ${OUT_FILE}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
