import type { ReactNode } from "react";

import { cx } from "./cx";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
};

export const FIELD_CONTROL =
  "min-h-tactil w-full rounded-sm border bg-superficie px-4 text-base text-marino transition-colors placeholder:text-tinta-suave/70 focus-visible:border-marino-600";

export function fieldBorder(hasError: boolean): string {
  return hasError ? "border-rocoto-texto" : "border-borde hover:border-marino-600";
}

/** Etiqueta, ayuda y error compartidos por Input y Select. */
export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
        {required ? <span className="text-tinta-suave font-normal"> (obligatorio)</span> : null}
      </label>
      {children(describedBy)}
      {hint ? (
        <p id={hintId} className="text-tinta-suave text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={cx("text-rocoto-texto text-sm font-semibold")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
