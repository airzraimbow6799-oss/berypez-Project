/**
 * Cliente mínimo de la Management API de Supabase (https://api.supabase.com).
 * Requiere SUPABASE_ACCESS_TOKEN (token personal, secreto) y NEXT_PUBLIC_SUPABASE_URL.
 */
const API = "https://api.supabase.com/v1";

export function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = /^https:\/\/([a-z0-9]{20})\.supabase\.co/.exec(url);
  if (!match?.[1]) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL de proyecto de Supabase.");
  }
  return match[1];
}

function token(): string {
  const value = process.env.SUPABASE_ACCESS_TOKEN;
  if (!value) {
    throw new Error("Falta SUPABASE_ACCESS_TOKEN en .env.local.");
  }
  return value;
}

export async function managementApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/projects/${projectRef()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Ejecuta SQL arbitrario (como rol postgres). Usar solo en scripts. */
export function runSql<T = unknown>(query: string): Promise<T[]> {
  return managementApi<T[]>("/database/query", { method: "POST", body: JSON.stringify({ query }) });
}
