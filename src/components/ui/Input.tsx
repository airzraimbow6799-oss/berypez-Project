"use client";

import { type InputHTMLAttributes, useId } from "react";

import { cx } from "./cx";
import { FIELD_CONTROL, Field, fieldBorder } from "./Field";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, required, className, ...rest }: InputProps) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <input
          {...rest}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cx(FIELD_CONTROL, fieldBorder(Boolean(error)), className)}
        />
      )}
    </Field>
  );
}
