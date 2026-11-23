"use client";

import { Banknote, BellRing, CreditCard, FlaskConical, Lock, Smartphone } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cx } from "@/components/ui/cx";
import { FIELD_CONTROL, fieldBorder } from "@/components/ui/Field";
import {
  BRAND_LABELS,
  type CardInput,
  cardLength,
  cvvLength,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  onlyDigits,
  TEST_CARDS,
} from "@/features/payments/card";
import type { PaymentMethodId } from "@/features/payments/simulate";

import { CardPreview } from "./CardPreview";

export type PayData = { phone: string; yapeCode: string; card: CardInput };

export const EMPTY_PAY_DATA: PayData = {
  phone: "",
  yapeCode: "",
  card: { number: "", name: "", expiry: "", cvv: "" },
};

const METHODS: ReadonlyArray<{
  id: PaymentMethodId;
  label: string;
  hint: string;
  icon: typeof Banknote;
}> = [
  { id: "cash", label: "Efectivo", hint: "Pagas al recibir o recoger", icon: Banknote },
  { id: "yape", label: "Yape", hint: "Con tu código de 6 dígitos", icon: Smartphone },
  { id: "plin", label: "Plin", hint: "Apruebas desde tu app", icon: BellRing },
  { id: "card", label: "Tarjeta", hint: "Visa, Mastercard, Amex, Diners", icon: CreditCard },
];

/** Campo de texto del pago: etiqueta arriba, error debajo y 48 px de alto. */
function PayField({
  label,
  error,
  hint,
  mono,
  ...input
}: {
  label: string;
  error?: string;
  hint?: string;
  mono?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">) {
  const id = input.id ?? `pay-${input.name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        {...input}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(FIELD_CONTROL, fieldBorder(Boolean(error)), mono && "font-mono tabular-nums")}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-tinta-suave text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Paso «Pago» del checkout en modo demostración: cuatro medios (efectivo, Yape, Plin y
 * tarjeta) con la tarjeta que se arma al escribir. Todo es simulado: no cobra ni crea pedidos.
 * En producción el paso sigue siendo solo efectivo hasta tener la pasarela real.
 */
export function PaymentBlock({
  method,
  onMethodChange,
  data,
  onDataChange,
  errors,
  isBusy,
  cashField,
}: {
  method: PaymentMethodId;
  onMethodChange: (method: PaymentMethodId) => void;
  data: PayData;
  onDataChange: (patch: Partial<PayData>) => void;
  errors: Record<string, string | undefined>;
  isBusy: boolean;
  /** El campo «¿Con cuánto pagas?», que solo aplica al efectivo. */
  cashField: ReactNode;
}) {
  const [isCvvFocused, setIsCvvFocused] = useState(false);
  const brand = detectBrand(data.card.number);
  const setCard = (patch: Partial<CardInput>) => onDataChange({ card: { ...data.card, ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <p className="bg-aji-100 text-marino flex items-start gap-2 rounded-md px-4 py-3 text-sm">
        <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong>Simulación para la demostración.</strong> No se cobra nada ni se crea un pedido
          real. La pasarela de verdad (Culqi, Izipay, Niubiz o Mercado Pago) se conecta aquí mismo.
        </span>
      </p>

      <div
        role="radiogroup"
        aria-label="Medio de pago"
        className="grid grid-cols-2 gap-2 lg:grid-cols-4"
      >
        {METHODS.map(({ id, label, hint, icon: Icon }) => {
          const isChosen = method === id;
          return (
            <label
              key={id}
              className={cx(
                "min-h-tactil relative flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)]",
                isChosen
                  ? "border-marino bg-aji-100 shadow-sm"
                  : "border-borde bg-superficie hover:border-marino-600",
                isBusy && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="radio"
                name="pago"
                value={id}
                checked={isChosen}
                disabled={isBusy}
                onChange={() => onMethodChange(id)}
                // Invisible pero encima de toda la tarjeta: el clic, el teclado y los lectores de
                // pantalla usan el radio real.
                className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <Icon aria-hidden="true" className="size-6" />
              <span className="font-semibold">{label}</span>
              <span className="text-tinta-suave text-xs">{hint}</span>
            </label>
          );
        })}
      </div>

      <div aria-live="polite" className="flex flex-col gap-4">
        {method === "card" ? (
          <div className="grid items-start gap-5 md:grid-cols-2">
            <CardPreview
              number={data.card.number}
              name={data.card.name}
              expiry={data.card.expiry}
              cvv={data.card.cvv}
              brand={brand}
              isFlipped={isCvvFocused}
            />
            <div className="flex flex-col gap-3">
              <PayField
                label="Número de tarjeta"
                name="cc-number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                mono
                maxLength={cardLength(brand) + 4}
                value={data.card.number}
                error={errors.number}
                hint={brand === "desconocida" ? undefined : `Detectamos ${BRAND_LABELS[brand]}.`}
                onChange={(e) => setCard({ number: formatCardNumber(e.target.value) })}
              />
              <PayField
                label="Nombre en la tarjeta"
                name="cc-name"
                autoComplete="cc-name"
                value={data.card.name}
                error={errors.name}
                onChange={(e) => setCard({ name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <PayField
                  label="Vence"
                  name="cc-exp"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  mono
                  maxLength={5}
                  value={data.card.expiry}
                  error={errors.expiry}
                  onChange={(e) => setCard({ expiry: formatExpiry(e.target.value) })}
                />
                <PayField
                  label="Código (CVV)"
                  name="cc-csc"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder={"•".repeat(cvvLength(brand))}
                  mono
                  maxLength={cvvLength(brand)}
                  value={data.card.cvv}
                  error={errors.cvv}
                  onFocus={() => setIsCvvFocused(true)}
                  onBlur={() => setIsCvvFocused(false)}
                  onChange={(e) => setCard({ cvv: onlyDigits(e.target.value) })}
                />
              </div>
            </div>
          </div>
        ) : null}

        {method === "yape" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <ol className="bg-crema-200 flex flex-col gap-2 rounded-md p-4 text-sm">
              <li>
                <strong>1.</strong> Abre tu app de Yape.
              </li>
              <li>
                <strong>2.</strong> Entra a <em>Código de aprobación</em>.
              </li>
              <li>
                <strong>3.</strong> Escribe aquí los 6 dígitos. Vale unos minutos.
              </li>
            </ol>
            <div className="flex flex-col gap-3">
              <PayField
                label="Celular de Yape"
                name="yape-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={data.phone}
                error={errors.phone}
                onChange={(e) => onDataChange({ phone: onlyDigits(e.target.value).slice(0, 9) })}
              />
              <PayField
                label="Código de aprobación"
                name="yape-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                mono
                maxLength={6}
                value={data.yapeCode}
                error={errors.yapeCode}
                onChange={(e) => onDataChange({ yapeCode: onlyDigits(e.target.value).slice(0, 6) })}
              />
            </div>
          </div>
        ) : null}

        {method === "plin" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <p className="bg-crema-200 flex items-start gap-3 rounded-md p-4 text-sm">
              <BellRing aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span>
                Te llega una solicitud a tu app de banca (Plin) por el monto del pedido. La apruebas
                con tu huella o clave y el pedido sigue solo.
              </span>
            </p>
            <PayField
              label="Celular afiliado a Plin"
              name="plin-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={data.phone}
              error={errors.phone}
              onChange={(e) => onDataChange({ phone: onlyDigits(e.target.value).slice(0, 9) })}
            />
          </div>
        ) : null}

        {method === "cash" ? cashField : null}
      </div>

      <p className="text-tinta-suave flex items-start gap-2 text-sm">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Pago seguro: los datos de la tarjeta van directo a la pasarela. La web nunca los guarda.
        </span>
      </p>

      {method !== "cash" ? (
        <p className="text-tinta-suave text-xs">
          Para probar: tarjeta <span className="font-mono">{TEST_CARDS.aprobada}</span> (aprobada) o{" "}
          <span className="font-mono">{TEST_CARDS.rechazada}</span> (rechazada), vence en el futuro
          y cualquier código. En Yape, el código <span className="font-mono">000000</span> se
          rechaza.
        </p>
      ) : null}
    </div>
  );
}
