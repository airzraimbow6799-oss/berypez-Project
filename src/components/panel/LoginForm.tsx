"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

/** F3-06 · Ingreso del personal con Supabase Auth (correo y contraseña). */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (authError) {
      // Mensaje genérico: no revela si el correo existe.
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.replace("/panel");
    router.refresh();
  };

  return (
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
  );
}
