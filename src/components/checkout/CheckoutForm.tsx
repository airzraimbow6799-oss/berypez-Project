"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";

import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCart } from "@/features/cart/store";
import { useQuote } from "@/features/cart/use-quote";
import { checkoutSchema, fieldErrors } from "@/features/checkout/schema";
import { clearFieldError, type ErrorMap, fieldError } from "@/features/forms/field-errors";
import { MODE_OPTIONS, modeId, readStoredMode, writeStoredMode } from "@/features/order-mode/mode";
import { formatPrice } from "@/lib/format";

type BranchesData = {
  branches: Array<{ slug: string; name: string; status: { isOpen: boolean; label: string } }>;
  zones: Array<{ district: string; feeCents: number; etaMinutes: number }>;
};

function useBranches() {
  const [data, setData] = useState<BranchesData | null>(null);
  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => json.success && setData(json.data))
      .catch(() => setData(null));
  }, []);
  return data;
}

function Block({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="border-borde bg-superficie rounded-md border p-5 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <h2 className="flex items-center gap-3 text-2xl font-semibold" aria-hidden="true">
        <span className="bg-marino text-crema grid size-8 place-items-center rounded-full font-sans text-base">
          {step}
        </span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function RadioCard({
  name,
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`min-h-tactil flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)] ${checked ? "border-marino bg-aji-100" : "border-borde"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="accent-marino size-5"
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint ? <span className="text-tinta-suave block text-sm">{hint}</span> : null}
      </span>
    </label>
  );
}

const INITIAL = {
  name: "",
  phone: "",
  email: "",
  modeId: "pickup:lince",
  district: "",
  address: "",
  addressReference: "",
  when: "now" as "now" | "later",
  scheduledFor: "",
  cashChange: "",
  notes: "",
  acceptTerms: false,
};

/** F2-10 · Checkout en una página: Contacto · Entrega · Pago, con validación en línea. */
export function CheckoutForm() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const branches = useBranches();
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<ErrorMap>({});
  const [formError, setFormError] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = readStoredMode(window.sessionStorage);
      if (stored) setForm((f) => ({ ...f, modeId: modeId(stored) }));
    } catch {
      // Sin sessionStorage: se queda la opción por defecto.
    }
  }, []);

  const mode = MODE_OPTIONS.find((o) => o.id === form.modeId)?.mode ?? {
    modality: "pickup" as const,
    branch: "lince" as const,
  };
  const branchSlug = mode.modality === "pickup" ? mode.branch : "lince";
  const quote = useQuote(lines, { modality: mode.modality, branchSlug, district: form.district });
  const onToken = useCallback((value: string) => setToken(value), []);

  const payload = {
    name: form.name,
    phone: form.phone,
    email: form.email,
    modality: mode.modality,
    branchSlug,
    district: mode.modality === "delivery" ? form.district : "",
    address: mode.modality === "delivery" ? form.address : "",
    addressReference: mode.modality === "delivery" ? form.addressReference : "",
    scheduledFor:
      form.when === "later" && form.scheduledFor ? new Date(form.scheduledFor).toISOString() : "",
    paymentMethod: "cash" as const,
    cashChangeForCents: form.cashChange ? Math.round(Number(form.cashChange) * 100) : null,
    notes: form.notes,
    acceptTerms: form.acceptTerms,
    turnstileToken: token,
    items: lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      choices: l.choices,
      note: l.note,
    })),
  };
  const validation = checkoutSchema.safeParse(payload);
  const clientErrors = validation.success ? {} : fieldErrors(validation.error);
  const errorFor = (field: string) => fieldError(serverErrors, clientErrors, touched, field);

  const set = (field: keyof typeof INITIAL) => (value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    setServerErrors((e) => clearFieldError(e, field));
  };
  const blur = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validation.success) {
      setTouched(Object.fromEntries(Object.keys(clientErrors).map((k) => [k, true])));
      setFormError("Revisa los datos marcados.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const json = await res.json();
      if (json.success) {
        clear();
        router.push(`/pedido/${json.data.trackingToken}`);
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

  if (isMounted && lines.length === 0) {
    return (
      <div className="border-borde bg-superficie mt-6 rounded-md border p-8 text-center">
        <p className="text-xl font-semibold">Tu carrito está vacío.</p>
        <Button href="/carta/marina" className="mt-4">
          Ver la carta
        </Button>
      </div>
    );
  }

  const zone = branches?.zones.find((z) => z.district === form.district);
  const branchStatus = branches?.branches.find((b) => b.slug === branchSlug)?.status;
  const total = quote.status === "ready" ? quote.quote : null;

  return (
    <form noValidate onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Block step={1} title="Contacto">
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
            hint="Te llamamos o escribimos por WhatsApp si hace falta."
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
        </Block>

        <Block step={2} title="Entrega">
          <div
            role="radiogroup"
            aria-label="Cómo recibes tu pedido"
            className="grid gap-2 sm:grid-cols-3"
          >
            {MODE_OPTIONS.map((option) => (
              <RadioCard
                key={option.id}
                name="modalidad"
                checked={form.modeId === option.id}
                onChange={() => {
                  set("modeId")(option.id);
                  try {
                    writeStoredMode(window.sessionStorage, option.mode);
                  } catch {
                    /* sin sessionStorage */
                  }
                }}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </div>
          {mode.modality === "delivery" ? (
            <>
              <Select
                label="Distrito"
                name="district"
                required
                placeholder="Elige tu distrito"
                value={form.district}
                onChange={(e) => set("district")(e.target.value)}
                onBlur={blur("district")}
                error={errorFor("district")}
                options={(branches?.zones ?? []).map((z) => ({
                  value: z.district,
                  label: `${z.district} · envío ${formatPrice(z.feeCents)}`,
                }))}
                hint={zone ? `Llega en unos ${zone.etaMinutes} minutos.` : undefined}
              />
              <Input
                label="Dirección"
                name="address"
                autoComplete="street-address"
                required
                value={form.address}
                onChange={(e) => set("address")(e.target.value)}
                onBlur={blur("address")}
                error={errorFor("address")}
              />
              <Input
                label="Referencia"
                name="addressReference"
                hint="Opcional: piso, color de la puerta, cerca de…"
                value={form.addressReference}
                onChange={(e) => set("addressReference")(e.target.value)}
              />
            </>
          ) : branchStatus ? (
            <p
              className={`text-sm font-semibold ${branchStatus.isOpen ? "text-limon-texto" : "text-rocoto-texto"}`}
            >
              {branchStatus.label}
            </p>
          ) : null}

          <div role="radiogroup" aria-label="Cuándo" className="grid gap-2 sm:grid-cols-2">
            <RadioCard
              name="cuando"
              checked={form.when === "now"}
              onChange={() => set("when")("now")}
              label="Lo antes posible"
            />
            <RadioCard
              name="cuando"
              checked={form.when === "later"}
              onChange={() => set("when")("later")}
              label="Programar"
              hint="Para otra hora o día"
            />
          </div>
          {form.when === "later" ? (
            <Input
              label="Fecha y hora"
              name="scheduledFor"
              type="datetime-local"
              required
              value={form.scheduledFor}
              onChange={(e) => set("scheduledFor")(e.target.value)}
              onBlur={blur("scheduledFor")}
              error={errorFor("scheduledFor")}
            />
          ) : null}
        </Block>

        <Block step={3} title="Pago">
          <div role="radiogroup" aria-label="Medio de pago" className="grid gap-2 sm:grid-cols-2">
            <RadioCard
              name="pago"
              checked
              onChange={() => undefined}
              label="Efectivo al recibir"
              hint="Pagas al recibir o al recoger"
            />
            <RadioCard
              name="pago"
              checked={false}
              onChange={() => undefined}
              disabled
              label="Yape, Plin o tarjeta"
              hint="Muy pronto"
            />
          </div>
          <Input
            label="¿Con cuánto pagas?"
            name="cashChange"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.10"
            hint="Opcional: para llevarte el vuelto exacto."
            value={form.cashChange}
            onChange={(e) => set("cashChange")(e.target.value)}
            onBlur={blur("cashChangeForCents")}
            error={errorFor("cashChangeForCents")}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="font-semibold">
              Notas del pedido <span className="text-tinta-suave font-normal">(opcional)</span>
            </label>
            <textarea
              id="notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              className="border-borde bg-superficie w-full rounded-sm border px-4 py-3"
            />
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => set("acceptTerms")(e.target.checked)}
              onBlur={blur("acceptTerms")}
              className="accent-marino mt-1 size-5"
              aria-describedby="terms-error"
            />
            <span>
              Acepto los{" "}
              <a href="/terminos" className="underline underline-offset-4">
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacidad" className="underline underline-offset-4">
                política de privacidad
              </a>
              .
            </span>
          </label>
          {errorFor("acceptTerms") ? (
            <p id="terms-error" role="alert" className="text-rocoto-texto text-sm font-semibold">
              {errorFor("acceptTerms")}
            </p>
          ) : null}
          <TurnstileWidget
            onToken={onToken}
            resetKey={resetKey}
            error={serverErrors.turnstileToken}
          />
        </Block>
      </div>

      <aside
        aria-label="Resumen del pedido"
        className="lg:sticky lg:top-[calc(var(--altura-header)+1rem)] lg:self-start"
      >
        <div className="border-borde bg-superficie rounded-md border p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Resumen</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-2">
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span className="tabular-nums">{formatPrice(l.unitPriceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="border-borde mt-3 space-y-1 border-t pt-3">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{total ? formatPrice(total.subtotalCents) : "…"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd className="tabular-nums">
                {mode.modality === "pickup"
                  ? "Gratis"
                  : total && form.district
                    ? formatPrice(total.deliveryCents)
                    : "Elige distrito"}
              </dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums" aria-live="polite">
                {total ? formatPrice(total.totalCents) : "…"}
              </dd>
            </div>
          </dl>
          {formError ? (
            <p role="alert" className="text-rocoto-texto mt-3 text-sm font-semibold">
              {formError}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-4 w-full" isLoading={isSubmitting}>
            {total ? `Confirmar pedido · ${formatPrice(total.totalCents)}` : "Confirmar pedido"}
          </Button>
        </div>
      </aside>
    </form>
  );
}
