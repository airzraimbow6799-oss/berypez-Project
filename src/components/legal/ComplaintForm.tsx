"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";

import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { COMPLAINT_RESPONSE_DAYS } from "@/config/legal";
import { fieldErrors } from "@/features/checkout/schema";
import { complaintSchema } from "@/features/complaints/place-complaint";

const INITIAL = {
  kind: "reclamo",
  branchSlug: "",
  name: "",
  documentType: "DNI",
  documentNumber: "",
  phone: "",
  email: "",
  address: "",
  isMinor: false,
  guardianName: "",
  itemType: "producto",
  amount: "",
  description: "",
  request: "",
};

/** F4-04 · Formulario del Libro de Reclamaciones con constancia en pantalla. */
export function ComplaintForm() {
  const [form, setForm] = useState(INITIAL);
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ number: number; createdAt: string } | null>(null);
  const onToken = useCallback((value: string) => setToken(value), []);

  const payload = {
    ...form,
    amountCents: form.amount ? Math.round(Number(form.amount) * 100) : null,
    turnstileToken: token,
  };
  const validation = complaintSchema.safeParse(payload);
  const errors = validation.success ? {} : fieldErrors(validation.error);
  const errorFor = (f: string) => serverErrors[f] ?? (touched[f] ? errors[f] : undefined);
  const set = (field: keyof typeof INITIAL) => (value: string | boolean) => {
    setForm((s) => ({ ...s, [field]: value }));
    setServerErrors((e) => ({ ...e, [field]: "" }));
  };
  const blur = (f: string) => () => setTouched((t) => ({ ...t, [f]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validation.success) {
      setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
      setFormError("Revisa los datos marcados.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const json = await res.json();
      if (json.success) {
        setReceipt(json.data);
        window.scrollTo({ top: 0 });
        return;
      }
      setServerErrors(json.error.fields ?? {});
      setFormError(json.error.message);
      if (res.status === 403) setResetKey((k) => k + 1);
    } catch {
      setFormError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    const date = new Intl.DateTimeFormat("es-PE", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Lima",
    }).format(new Date(receipt.createdAt));
    return (
      <section
        aria-labelledby="constancia"
        className="border-borde bg-superficie mt-6 rounded-md border p-6 text-center shadow-sm"
      >
        <CheckCircle2 aria-hidden="true" className="text-limon-texto mx-auto size-14" />
        <h2 id="constancia" className="mt-3 text-2xl font-semibold">
          {form.kind === "reclamo" ? "Reclamo" : "Queja"} N.º{" "}
          {String(receipt.number).padStart(6, "0")}
        </h2>
        <p className="text-tinta-suave mt-2">
          Registrado el {date}. Te responderemos en un plazo de {COMPLAINT_RESPONSE_DAYS} a{" "}
          {form.email}.
        </p>
        <Button variant="secundario" className="mt-5" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="size-5" /> Imprimir constancia
        </Button>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-6">
      <fieldset className="border-borde bg-superficie flex flex-col gap-4 rounded-md border p-5 shadow-sm">
        <legend className="px-1 text-lg font-semibold">1. Tus datos</legend>
        <Input
          label="Nombre completo"
          name="name"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          onBlur={blur("name")}
          error={errorFor("name")}
        />
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Select
            label="Documento"
            name="documentType"
            value={form.documentType}
            onChange={(e) => set("documentType")(e.target.value)}
            options={["DNI", "CE", "PASAPORTE", "RUC"].map((v) => ({
              value: v,
              label: v === "CE" ? "Carné de extranjería" : v === "PASAPORTE" ? "Pasaporte" : v,
            }))}
          />
          <Input
            label="Número de documento"
            name="documentNumber"
            required
            value={form.documentNumber}
            onChange={(e) => set("documentNumber")(e.target.value)}
            onBlur={blur("documentNumber")}
            error={errorFor("documentNumber")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Celular"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            onBlur={blur("phone")}
            error={errorFor("phone")}
          />
          <Input
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            required
            hint="Aquí te enviamos la constancia y la respuesta."
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            onBlur={blur("email")}
            error={errorFor("email")}
          />
        </div>
        <Input
          label="Domicilio"
          name="address"
          autoComplete="street-address"
          hint="Opcional."
          value={form.address}
          onChange={(e) => set("address")(e.target.value)}
        />
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.isMinor}
            onChange={(e) => set("isMinor")(e.target.checked)}
            className="accent-marino size-5"
          />
          Soy menor de edad
        </label>
        {form.isMinor ? (
          <Input
            label="Nombre del padre, madre o apoderado"
            name="guardianName"
            required
            value={form.guardianName}
            onChange={(e) => set("guardianName")(e.target.value)}
            onBlur={blur("guardianName")}
            error={errorFor("guardianName")}
          />
        ) : null}
      </fieldset>

      <fieldset className="border-borde bg-superficie flex flex-col gap-4 rounded-md border p-5 shadow-sm">
        <legend className="px-1 text-lg font-semibold">2. Qué pasó</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Tipo"
            name="kind"
            value={form.kind}
            onChange={(e) => set("kind")(e.target.value)}
            options={[
              { value: "reclamo", label: "Reclamo" },
              { value: "queja", label: "Queja" },
            ]}
          />
          <Select
            label="Sede"
            name="branchSlug"
            value={form.branchSlug}
            onChange={(e) => set("branchSlug")(e.target.value)}
            options={[
              { value: "", label: "No aplica / web" },
              { value: "lince", label: "Lince" },
              { value: "jesus-maria", label: "Jesús María" },
            ]}
          />
          <Select
            label="Bien contratado"
            name="itemType"
            value={form.itemType}
            onChange={(e) => set("itemType")(e.target.value)}
            options={[
              { value: "producto", label: "Producto" },
              { value: "servicio", label: "Servicio" },
            ]}
          />
        </div>
        <Input
          label="Monto reclamado (S/)"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.10"
          hint="Opcional."
          value={form.amount}
          onChange={(e) => set("amount")(e.target.value)}
        />
        {(["description", "request"] as const).map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <label htmlFor={field} className="font-semibold">
              {field === "description" ? "Detalle" : "Pedido"}{" "}
              <span className="text-tinta-suave font-normal">(obligatorio)</span>
            </label>
            <textarea
              id={field}
              rows={field === "description" ? 5 : 3}
              maxLength={field === "description" ? 2000 : 1000}
              value={form[field]}
              onChange={(e) => set(field)(e.target.value)}
              onBlur={blur(field)}
              aria-invalid={Boolean(errorFor(field))}
              aria-describedby={errorFor(field) ? `${field}-error` : undefined}
              placeholder={
                field === "description"
                  ? "Cuéntanos qué pasó, con fecha y número de pedido si lo tienes."
                  : "¿Qué solución esperas?"
              }
              className="border-borde bg-superficie w-full rounded-sm border px-4 py-3"
            />
            {errorFor(field) ? (
              <p
                id={`${field}-error`}
                role="alert"
                className="text-rocoto-texto text-sm font-semibold"
              >
                {errorFor(field)}
              </p>
            ) : null}
          </div>
        ))}
        <TurnstileWidget onToken={onToken} resetKey={resetKey} />
      </fieldset>

      {formError ? (
        <p role="alert" className="text-rocoto-texto font-semibold">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="sm:self-start">
        Enviar {form.kind}
      </Button>
    </form>
  );
}
