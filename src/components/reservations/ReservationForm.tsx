"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BRANCHES } from "@/config/site";
import { fieldErrors } from "@/features/checkout/schema";
import { MAX_PARTY, reservationSchema } from "@/features/reservations/place-reservation";

type Slot = { time: string; available: boolean };

function limaToday(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(date);
}

const OCCASIONS = [
  "",
  "Cumpleaños",
  "Aniversario",
  "Reunión de trabajo",
  "Almuerzo familiar",
  "Otra",
];

/** F4-05 · Reserva en una pantalla: sede, fecha, personas, hora, zona, ocasión y datos. */
export function ReservationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialBranch = params.get("sede") === "jesus-maria" ? "jesus-maria" : "lince";
  const [form, setForm] = useState({
    branchSlug: initialBranch,
    date: limaToday(1),
    partySize: 2,
    time: "",
    area: "",
    occasion: "",
    name: "",
    phone: "",
    email: "",
    acceptPrivacy: false,
  });
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onToken = useCallback((value: string) => setToken(value), []);

  useEffect(() => {
    const controller = new AbortController();
    setSlots(null);
    setSlotsError("");
    fetch(
      `/api/reservations/availability?branch=${form.branchSlug}&date=${form.date}&party=${form.partySize}`,
      {
        signal: controller.signal,
      },
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSlots(json.data.slots);
        else setSlotsError(json.error.message);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setSlotsError("No pudimos cargar los horarios.");
      });
    return () => controller.abort();
  }, [form.branchSlug, form.date, form.partySize]);

  const payload = { ...form, turnstileToken: token };
  const validation = reservationSchema.safeParse(payload);
  const errors = validation.success ? {} : fieldErrors(validation.error);
  const errorFor = (field: string) =>
    serverErrors[field] ?? (touched[field] ? errors[field] : undefined);
  const set = (field: keyof typeof form) => (value: string | number | boolean) => {
    setForm((f) => ({
      ...f,
      [field]: value,
      ...(field === "date" || field === "branchSlug" || field === "partySize" ? { time: "" } : {}),
    }));
    setServerErrors((e) => ({ ...e, [field]: "" }));
  };
  const blur = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }));

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
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/reservas/${json.data.manageToken}`);
        return;
      }
      setServerErrors(json.error.fields ?? {});
      setFormError(json.error.message);
      if (res.status === 403) setResetKey((k) => k + 1);
      if (res.status === 409) setForm((f) => ({ ...f, time: "" }));
    } catch {
      setFormError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const available = slots?.filter((s) => s.available) ?? [];

  return (
    <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-6">
      <fieldset className="border-borde bg-superficie flex flex-col gap-4 rounded-md border p-5 shadow-sm">
        <legend className="sr-only">Cuándo y dónde</legend>
        <div role="radiogroup" aria-label="Sede" className="grid grid-cols-2 gap-2">
          {BRANCHES.map((branch) => (
            <label
              key={branch.slug}
              className={`min-h-tactil flex cursor-pointer items-center gap-3 rounded-sm border px-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)] ${form.branchSlug === branch.slug ? "border-marino bg-aji-100" : "border-borde"}`}
            >
              <input
                type="radio"
                name="sede"
                checked={form.branchSlug === branch.slug}
                onChange={() => set("branchSlug")(branch.slug)}
                className="accent-marino size-5"
              />
              <span className="font-semibold">{branch.name}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha"
            type="date"
            name="date"
            required
            min={limaToday(0)}
            max={limaToday(60)}
            value={form.date}
            onChange={(e) => set("date")(e.target.value)}
            error={errorFor("date")}
          />
          <Select
            label="Personas"
            name="partySize"
            value={String(form.partySize)}
            onChange={(e) => set("partySize")(Number(e.target.value))}
            options={Array.from({ length: MAX_PARTY }, (_, i) => ({
              value: String(i + 1),
              label: i === 0 ? "1 persona" : `${i + 1} personas`,
            }))}
            hint={`Para más de ${MAX_PARTY}, escríbenos por WhatsApp.`}
          />
        </div>
        <div>
          <p id="horas" className="font-semibold">
            Hora
          </p>
          <div aria-busy={slots === null} aria-live="polite">
            {slotsError ? (
              <p role="alert" className="text-rocoto-texto mt-2 text-sm font-semibold">
                {slotsError}
              </p>
            ) : slots === null ? (
              <p className="text-tinta-suave mt-2 text-sm">Buscando horarios…</p>
            ) : available.length === 0 ? (
              <p className="text-tinta-suave mt-2">
                No hay horarios libres ese día. Prueba con otra fecha o sede.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-labelledby="horas"
                className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5"
              >
                {slots.map((slot) => (
                  <label
                    key={slot.time}
                    className={`min-h-tactil flex items-center justify-center rounded-sm border font-semibold tabular-nums has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)] ${!slot.available ? "border-borde text-tinta-suave cursor-not-allowed line-through opacity-50" : form.time === slot.time ? "border-marino bg-marino text-crema cursor-pointer" : "border-borde hover:border-marino-600 cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="hora"
                      className="sr-only"
                      disabled={!slot.available}
                      checked={form.time === slot.time}
                      onChange={() => set("time")(slot.time)}
                      onBlur={blur("time")}
                    />
                    {slot.time}
                  </label>
                ))}
              </div>
            )}
          </div>
          {errorFor("time") ? (
            <p role="alert" className="text-rocoto-texto mt-1 text-sm font-semibold">
              {errorFor("time")}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Zona"
            name="area"
            value={form.area}
            onChange={(e) => set("area")(e.target.value)}
            options={[
              { value: "", label: "Sin preferencia" },
              { value: "interior", label: "Interior" },
              { value: "terraza", label: "Terraza" },
            ]}
          />
          <Select
            label="Ocasión"
            name="occasion"
            value={form.occasion}
            onChange={(e) => set("occasion")(e.target.value)}
            options={OCCASIONS.map((o) => ({ value: o, label: o || "Ninguna en especial" }))}
          />
        </div>
      </fieldset>

      <fieldset className="border-borde bg-superficie flex flex-col gap-4 rounded-md border p-5 shadow-sm">
        <legend className="sr-only">Tus datos</legend>
        <Input
          label="Nombre"
          name="name"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          onBlur={blur("name")}
          error={errorFor("name")}
        />
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
          hint="Opcional: para enviarte la confirmación."
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          onBlur={blur("email")}
          error={errorFor("email")}
        />
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.acceptPrivacy}
            onChange={(e) => set("acceptPrivacy")(e.target.checked)}
            onBlur={blur("acceptPrivacy")}
            className="accent-marino mt-1 size-5"
          />
          <span>
            Acepto la{" "}
            <a href="/privacidad" className="underline underline-offset-4">
              política de privacidad
            </a>
            .
          </span>
        </label>
        {errorFor("acceptPrivacy") ? (
          <p role="alert" className="text-rocoto-texto text-sm font-semibold">
            {errorFor("acceptPrivacy")}
          </p>
        ) : null}
        <TurnstileWidget onToken={onToken} resetKey={resetKey} />
      </fieldset>

      {formError ? (
        <p role="alert" className="text-rocoto-texto font-semibold">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="sm:self-start">
        {form.time ? `Reservar para las ${form.time}` : "Reservar mesa"}
      </Button>
    </form>
  );
}
