import { Minus, Plus } from "lucide-react";

import { IconButton } from "./IconButton";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** Nombre del plato para los rótulos: “Agregar un Ceviche”. */
  itemName: string;
  min?: number;
  max?: number;
};

/** Selector de cantidad con botones de 48 px y el número anunciado al cambiar. */
export function Stepper({ value, onChange, itemName, min = 1, max = 50 }: StepperProps) {
  return (
    <div className="border-borde bg-superficie rounded-pill inline-flex items-center border">
      <IconButton
        label={`Quitar un ${itemName}`}
        icon={<Minus aria-hidden="true" className="size-5" />}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <span aria-live="polite" className="min-w-8 text-center font-semibold tabular-nums">
        {value}
      </span>
      <IconButton
        label={`Agregar un ${itemName}`}
        icon={<Plus aria-hidden="true" className="size-5" />}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  );
}
