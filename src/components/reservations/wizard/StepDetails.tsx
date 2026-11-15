import { Input } from "@/components/ui/Input";

import type { DraftUpdate, FieldErrors, ReservationDraft } from "./types";

const AREAS: Array<{ value: ReservationDraft["area"]; label: string }> = [
  { value: "", label: "Me da igual" },
  { value: "interior", label: "Adentro" },
  { value: "terraza", label: "Terraza" },
];

const OCCASIONS = ["", "Cumpleaños", "Aniversario", "Almuerzo familiar", "Reunión de trabajo"];

type Props = {
  draft: ReservationDraft;
  update: DraftUpdate;
  errors: FieldErrors;
  onBlur: (field: keyof ReservationDraft) => void;
};

function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value || "ninguna"}
            className={`rounded-pill min-h-tactil flex cursor-pointer items-center border-2 px-4 font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--color-foco)] ${
              value === option.value
                ? "border-marino bg-marino text-crema"
                : "border-borde bg-superficie hover:border-marino-600"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Paso 3 · Datos de contacto (lo justo) y preferencias opcionales. */
export function StepDetails({ draft, update, errors, onBlur }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Nombre y apellido"
        name="name"
        autoComplete="name"
        required
        placeholder="Ej.: Rosa Quispe"
        value={draft.name}
        onChange={(e) => update("name", e.target.value)}
        onBlur={() => onBlur("name")}
        error={errors.name}
      />
      <Input
        label="Celular"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="Ej.: 987 654 321"
        hint="Te llamamos solo si hay algún cambio en tu reserva."
        value={draft.phone}
        onChange={(e) => update("phone", e.target.value)}
        onBlur={() => onBlur("phone")}
        error={errors.phone}
      />
      <Input
        label="Correo (opcional)"
        name="email"
        type="email"
        autoComplete="email"
        hint="Para enviarte la confirmación."
        value={draft.email}
        onChange={(e) => update("email", e.target.value)}
        onBlur={() => onBlur("email")}
        error={errors.email}
      />

      <ChoiceGroup
        legend="¿Dónde prefieres sentarte? (opcional)"
        name="zona"
        options={AREAS}
        value={draft.area}
        onChange={(v) => update("area", v)}
      />
      <ChoiceGroup
        legend="¿Celebran algo? (opcional)"
        name="ocasion"
        options={OCCASIONS.map((o) => ({ value: o, label: o || "Nada en especial" }))}
        value={draft.occasion}
        onChange={(v) => update("occasion", v)}
      />

      <div>
        <label className="bg-crema-200 flex cursor-pointer items-start gap-3 rounded-md p-4">
          <input
            type="checkbox"
            checked={draft.acceptPrivacy}
            onChange={(e) => update("acceptPrivacy", e.target.checked)}
            onBlur={() => onBlur("acceptPrivacy")}
            aria-invalid={Boolean(errors.acceptPrivacy)}
            className="accent-marino mt-0.5 size-6 shrink-0"
          />
          <span>
            Acepto que Berypez use mis datos solo para esta reserva, según la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              política de privacidad
            </a>
            .
          </span>
        </label>
        {errors.acceptPrivacy ? (
          <p role="alert" className="text-rocoto-texto mt-1 font-semibold">
            {errors.acceptPrivacy}
          </p>
        ) : null}
      </div>
    </div>
  );
}
