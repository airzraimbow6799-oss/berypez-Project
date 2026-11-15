"use client";

import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes, useId } from "react";

import { cx } from "./cx";
import { FIELD_CONTROL, Field, fieldBorder } from "./Field";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
};

/** Select nativo: en celular abre el selector del sistema, el más cómodo para todas las edades. */
export function Select({
  label,
  options,
  placeholder,
  hint,
  error,
  required,
  className,
  defaultValue,
  ...rest
}: SelectProps) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <div className="relative">
          <select
            {...rest}
            id={id}
            required={required}
            defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cx(
              FIELD_CONTROL,
              fieldBorder(Boolean(error)),
              "appearance-none pr-11",
              className,
            )}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
}
