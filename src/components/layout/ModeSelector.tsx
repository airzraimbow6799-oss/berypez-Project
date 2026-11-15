"use client";

import { Bike, Check, ChevronDown, Store } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { MODE_OPTIONS, modeId, modeLabel, type OrderMode } from "@/features/order-mode/mode";
import { useOrderMode } from "@/features/order-mode/use-order-mode";

/**
 * Selector de modalidad y sede (Delivery / Recojo Lince / Recojo Jesús María).
 * Se recuerda durante la sesión. La tarifa, el tiempo y el mínimo llegan en F2-07.
 */
export function ModeSelector() {
  const [mode, setMode] = useOrderMode();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const choose = (next: OrderMode) => {
    setMode(next);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const Icon = mode?.modality === "pickup" ? Store : Bike;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="border-borde bg-superficie text-marino hover:border-marino-600 min-h-tactil rounded-pill inline-flex items-center gap-2 border px-4 text-sm font-semibold shadow-sm transition-colors"
      >
        <Icon aria-hidden="true" className="size-5" />
        <span>{mode ? modeLabel(mode) : "¿Delivery o recojo?"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-label="Cómo quieres recibir tu pedido"
          className="border-borde bg-superficie absolute top-full right-0 z-40 mt-2 w-72 rounded-md border p-2 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {MODE_OPTIONS.map((option) => {
              const selected = mode !== null && modeId(mode) === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(option.mode)}
                    className={`min-h-tactil flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left transition-colors ${
                      selected ? "bg-aji-100" : "hover:bg-crema-200"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{option.label}</span>
                      <span className="text-tinta-suave block text-sm">{option.hint}</span>
                    </span>
                    {selected ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
