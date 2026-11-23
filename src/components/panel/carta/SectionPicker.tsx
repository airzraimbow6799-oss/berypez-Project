"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { FIELD_CONTROL, fieldBorder } from "@/components/ui/Field";

const MIN_LENGTH = 2;
const MAX_LENGTH = 40;

const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Nombre de sección limpio: sin espacios de más y con la primera letra en mayúscula. */
export function cleanSectionName(text: string): string {
  const name = text.trim().replace(/\s+/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export type SectionCheck = { ok: true; name: string } | { ok: false; message: string };

/** Valida el nombre de una sección nueva. Si ya existe (sin importar tildes ni mayúsculas), devuelve la existente. */
export function checkNewSection(text: string, existing: readonly string[]): SectionCheck {
  const name = cleanSectionName(text);
  if (name.length < MIN_LENGTH) return { ok: false, message: "Escribe el nombre de la sección." };
  if (name.length > MAX_LENGTH) {
    return { ok: false, message: `Máximo ${MAX_LENGTH} letras.` };
  }
  const same = existing.find((e) => normalize(e) === normalize(name));
  return { ok: true, name: same ?? name };
}

/**
 * Elegir la sección de un plato (Ceviches, Sudados, Fuentes…) con el diseño de la página, en
 * lugar de la lista nativa del navegador, y crear una sección nueva sin salir del formulario.
 * La sección nueva existe desde que se guarda el plato.
 */
export function SectionPicker({
  value,
  onChange,
  sections,
  error,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Secciones que ya existen. */
  sections: readonly string[];
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [created, setCreated] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const all = [...sections, ...created, ...(value ? [value] : [])];
    const unique = all.filter(
      (name, i) => all.findIndex((o) => normalize(o) === normalize(name)) === i,
    );
    return unique.sort((a, b) => a.localeCompare(b, "es"));
  }, [sections, created, value]);

  // Al abrir, el foco va a la opción elegida (o a la primera) para poder usar el teclado.
  useEffect(() => {
    if (!isOpen) return;
    const index = Math.max(0, options.indexOf(value));
    optionRefs.current[index]?.focus();
    // Que se vea también «Crear una sección nueva», debajo de la lista.
    panelRef.current?.scrollIntoView?.({ block: "nearest" });
    // Solo al abrir: las opciones no cambian de lugar mientras se navega.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setDraft("");
    setDraftError("");
    triggerRef.current?.focus();
  };

  const pick = (name: string) => {
    onChange(name);
    close();
  };

  const create = () => {
    const result = checkNewSection(draft, options);
    if (!result.ok) {
      setDraftError(result.message);
      return;
    }
    if (!options.some((o) => normalize(o) === normalize(result.name))) {
      setCreated((previous) => [...previous, result.name]);
    }
    pick(result.name);
  };

  const onOptionKey = (event: KeyboardEvent<HTMLLIElement>, index: number, name: string) => {
    const move = (to: number) => {
      event.preventDefault();
      optionRefs.current[(to + options.length) % options.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(options.length - 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(name);
    }
  };

  return (
    <div
      onKeyDown={(event) => {
        // Escape cierra solo la lista, no todo el formulario.
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <label id={`${id}-label`} htmlFor={id} className="font-semibold">
        Sección<span className="text-tinta-suave font-normal"> (obligatorio)</span>
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cx(
          FIELD_CONTROL,
          fieldBorder(Boolean(error)),
          "mt-1.5 flex items-center justify-between gap-3 text-left",
        )}
      >
        <span className={value ? "" : "text-tinta-suave/70"}>{value || "Elige una sección"}</span>
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "size-5 shrink-0 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="bg-superficie border-borde mt-2 overflow-hidden rounded-md border shadow-md"
        >
          <ul
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="max-h-56 overflow-y-auto py-1"
          >
            {options.length === 0 ? (
              <li className="text-tinta-suave px-4 py-3 text-sm">
                Todavía no hay secciones. Crea la primera abajo.
              </li>
            ) : (
              options.map((name, index) => {
                const isChosen = name === value;
                return (
                  <li
                    key={name}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={isChosen}
                    tabIndex={-1}
                    onClick={() => pick(name)}
                    onKeyDown={(event) => onOptionKey(event, index, name)}
                    className={cx(
                      "min-h-tactil hover:bg-crema-200 focus-visible:bg-crema-200 flex cursor-pointer items-center justify-between gap-3 px-4 py-2 font-semibold",
                      isChosen && "bg-aji-100",
                    )}
                  >
                    {name}
                    {isChosen ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-borde bg-crema-200/60 border-t p-3">
            <label htmlFor={`${id}-nueva`} className="text-sm font-semibold">
              Crear una sección nueva
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={`${id}-nueva`}
                value={draft}
                maxLength={MAX_LENGTH + 10}
                autoComplete="off"
                placeholder="Por ejemplo: Postres"
                aria-invalid={draftError !== ""}
                aria-describedby={draftError ? `${id}-nueva-error` : undefined}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setDraftError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    // Enter crea la sección; no envía el formulario del plato.
                    event.preventDefault();
                    create();
                  }
                }}
                className={cx(FIELD_CONTROL, fieldBorder(draftError !== ""), "min-w-0 flex-1")}
              />
              <Button type="button" variant="secundario" onClick={create}>
                <Plus aria-hidden="true" className="size-5" /> Crear
              </Button>
            </div>
            {draftError ? (
              <p
                id={`${id}-nueva-error`}
                role="alert"
                className="text-rocoto-texto mt-1 text-sm font-semibold"
              >
                {draftError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {hint ? <p className="text-tinta-suave mt-1.5 text-sm">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-rocoto-texto mt-1.5 text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
