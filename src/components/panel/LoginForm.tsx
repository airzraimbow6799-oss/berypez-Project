"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEMO_ACCOUNTS, demoAccountForCredentials } from "@/features/demo/config";
import { createClient } from "@/lib/supabase/client";

/**
 * F3-06 · Ingreso del personal con Supabase Auth (correo y contraseña).
 * Con `demo` activo suma accesos de ejemplo por rol, que no usan Supabase ni datos reales.
 */
export function LoginForm({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const enter = () => {
    router.replace("/panel");
    router.refresh();
  };

  /** Entra con la cuenta simulada. Devuelve false si el servidor no la acepta. */
  const demoLogin = async (demoEmail: string, demoPassword: string): Promise<boolean> => {
    // Si había una sesión real abierta, se cierra: la real manda sobre la de demostración.
    await createClient().auth.signOut();
    const res = await fetch("/api/demo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    });
    return res.ok;
  };

  const enterAs = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setIsLoading(true);
    const isOk = await demoLogin(account.email, account.password);
    setIsLoading(false);
    if (!isOk) {
      setError("No se pudo entrar al modo demostración.");
      return;
    }
    enter();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (demo && demoAccountForCredentials(email, password)) {
      const isOk = await demoLogin(email, password);
      setIsLoading(false);
      if (isOk) enter();
      else setError("No se pudo entrar al modo demostración.");
      return;
    }

    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (authError) {
      // Mensaje genérico: no revela si el correo existe.
      setError("Correo o contraseña incorrectos.");
      return;
    }
    // Quita la cookie de una prueba anterior en modo demostración (si la hay).
    if (demo) await fetch("/api/demo/login", { method: "DELETE" }).catch(() => undefined);
    enter();
  };

  return (
    <>
      {demo ? (
        <section
          aria-labelledby="demo-titulo"
          className="bg-aji-100 border-aji mt-5 rounded-md border p-4"
        >
          <h2 id="demo-titulo" className="flex items-center gap-2 text-base font-semibold">
            <FlaskConical aria-hidden="true" className="size-4" />
            Modo demostración
          </h2>
          <p className="text-tinta-suave mt-1 text-sm">
            Entra con una cuenta de ejemplo para ver el panel de cada rol. Los datos no son reales.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.role}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => enterAs(account)}
                  className="bg-superficie border-borde hover:border-marino-600 min-h-tactil w-full rounded-sm border px-4 py-3 text-left transition-colors disabled:opacity-60"
                >
                  <span className="block font-semibold">Entrar como {account.title}</span>
                  <span className="text-tinta-suave block text-sm">{account.description}</span>
                  <span className="text-tinta-suave mt-1 block font-mono text-xs">
                    {account.email} · {account.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <Input
          label="Correo"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="text-rocoto-texto text-sm font-semibold">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" isLoading={isLoading}>
          Ingresar
        </Button>
      </form>
    </>
  );
}
