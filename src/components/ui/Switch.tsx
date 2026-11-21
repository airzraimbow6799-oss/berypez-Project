"use client";

import { cx } from "./cx";

type SwitchProps = {
  /** Nombre accesible: «Luis Paredes: activo». */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
  /** Texto visible junto al interruptor según el estado. El estado nunca va solo en color. */
  onText?: string;
  offText?: string;
  className?: string;
};

/** Interruptor accesible (role=switch) de 48 px de alto, con el estado dicho en texto. */
export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
  title,
  onText = "Activo",
  offText = "Inactivo",
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
      className={cx(
        "min-h-tactil rounded-pill inline-flex items-center gap-3 pr-1 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "relative inline-block h-7 w-12 rounded-full transition-colors duration-150",
          checked ? "bg-limon-texto" : "bg-tinta-suave/60",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span className="w-20 text-left text-sm font-semibold">{checked ? onText : offText}</span>
    </button>
  );
}
