"use client";

import { type FormEvent, type ReactNode, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { FIELD_CONTROL, fieldBorder } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { MENU_LINKS } from "@/config/site";
import {
  type DishFormInput,
  type DishFormOutput,
  dishFormSchema,
  type DishImage,
  formErrors,
  TAG_LABELS,
} from "@/features/carta/schema";
import { PRODUCT_TAGS } from "@/types/catalog";

import type { Outcome } from "./backend";
import { ChoiceGroupsEditor, PriceGroupEditor } from "./OptionGroupsEditor";
import { PhotoField } from "./PhotoField";
import { SectionPicker } from "./SectionPicker";

const toggle = <T,>(list: readonly T[], item: T, on: boolean): T[] =>
  on ? [...list, item] : list.filter((x) => x !== item);

/**
 * Formulario de «Añadir plato» y «Editar plato»: foto, nombre, descripción, cartas, sección,
 * precio, etiquetas (las que usa el buscador de la web) y apartados opcionales.
 * Se monta de nuevo cada vez que se abre (el padre le cambia la `key`), así arranca limpio.
 */
export function DishEditor({
  open,
  mode,
  initial,
  sections,
  onClose,
  onSave,
  onUpload,
}: {
  open: boolean;
  mode: "crear" | "editar";
  initial: DishFormInput;
  /** Secciones que ya existen, para elegirlas en la lista. */
  sections: readonly string[];
  onClose: () => void;
  /** Guarda el plato ya validado; el servidor vuelve a validar y puede devolver errores. */
  onSave: (input: DishFormInput, data: DishFormOutput) => Promise<Outcome>;
  /** Carta real: sube la foto al almacenamiento. Sin esto la foto queda en el navegador. */
  onUpload?: (file: File) => Promise<DishImage>;
}) {
  const formId = useId();
  const [form, setForm] = useState<DishFormInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const set = <K extends keyof DishFormInput>(key: K, value: DishFormInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isUploading) return;
    const parsed = dishFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(formErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setServerMessage("");
    setIsSaving(true);
    const outcome = await onSave(form, parsed.data);
    setIsSaving(false);
    if (!outcome.ok) {
      setErrors(outcome.errors ?? {});
      setServerMessage(outcome.message);
    }
  };

  const hasPriceGroup = form.priceGroup !== null;
  const errorCount = Object.keys(errors).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      title={mode === "crear" ? "Añadir plato" : `Editar «${initial.name}»`}
      description={
        mode === "crear"
          ? "Aparece en la carta al guardar. Las etiquetas ayudan a encontrarlo en el buscador."
          : "Los cambios se ven en la carta al guardar."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {errorCount > 0 || serverMessage ? (
            <p role="status" className="text-rocoto-texto mr-auto text-sm font-semibold">
              {errorCount > 0
                ? `Revisa ${errorCount === 1 ? "el campo marcado" : `los ${errorCount} campos marcados`}.`
                : serverMessage}
            </p>
          ) : null}
          <Button variant="fantasma" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} isLoading={isSaving} disabled={isUploading}>
            {mode === "crear" ? "Guardar plato" : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
        <PhotoField
          value={form.image}
          dishName={form.name}
          onChange={(v) => set("image", v)}
          onUpload={onUpload}
          onBusyChange={setIsUploading}
        />

        <Input
          label="Nombre"
          required
          autoComplete="off"
          value={form.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <TextArea
          label="Descripción"
          hint="Qué lleva y con qué se acompaña. Se usa también en el buscador."
          value={form.description}
          error={errors.description}
          onChange={(v) => set("description", v)}
        />

        <ChipGroup label="Cartas donde aparece" error={errors.menus}>
          {MENU_LINKS.map((menu) => (
            <Chip
              key={menu.slug}
              pressed={form.menus.includes(menu.slug)}
              onPressedChange={(on) => set("menus", toggle(form.menus, menu.slug, on))}
            >
              {menu.label}
            </Chip>
          ))}
        </ChipGroup>

        <SectionPicker
          value={form.section}
          sections={sections}
          hint="El grupo dentro de la carta: Ceviches, Sudados, Fuentes… Si no existe, créala aquí."
          error={errors.section}
          onChange={(name) => set("section", name)}
        />

        {hasPriceGroup ? (
          <p className="bg-crema-200 rounded-md px-4 py-3 text-sm">
            El precio sale del apartado con precio: la carta muestra «desde» la opción más barata.
          </p>
        ) : (
          <Input
            label="Precio (S/)"
            required
            inputMode="decimal"
            hint="Por ejemplo 38 o 38.50"
            value={form.price}
            error={errors.price}
            onChange={(e) => set("price", e.target.value)}
          />
        )}

        <ChipGroup
          label="Etiquetas"
          hint="Sirven para los filtros y el buscador de la web."
          error={errors.tags}
        >
          {PRODUCT_TAGS.map((tag) => (
            <Chip
              key={tag}
              pressed={form.tags.includes(tag)}
              onPressedChange={(on) => set("tags", toggle(form.tags, tag, on))}
            >
              {TAG_LABELS[tag]}
            </Chip>
          ))}
        </ChipGroup>

        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold">Apartados para elegir (opcional)</h3>
            <p className="text-tinta-suave text-sm">
              Lo que el cliente escoge al pedir, como en la vista rápida de la web. Si el plato no
              los necesita, déjalo así.
            </p>
          </div>
          <PriceGroupEditor
            value={form.priceGroup}
            errors={errors}
            onChange={(v) => set("priceGroup", v)}
          />
          <ChoiceGroupsEditor
            value={form.choiceGroups}
            errors={errors}
            onChange={(v) => set("choiceGroups", v)}
          />
        </div>

        <Switch
          label={`${form.name || "Plato"}: disponible`}
          checked={form.isAvailable}
          onChange={(v) => set("isAvailable", v)}
          onText="Disponible"
          offText="Agotado"
        />
      </form>
    </Dialog>
  );
}

function ChipGroup({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-semibold">{label}</legend>
      {hint ? <p className="text-tinta-suave -mt-1 text-sm">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">{children}</div>
      {error ? (
        <p role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function TextArea({
  label,
  hint,
  value,
  error,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const describedBy = [hint ? `${id}-ayuda` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_CONTROL} ${fieldBorder(Boolean(error))} py-3`}
      />
      {hint ? (
        <p id={`${id}-ayuda`} className="text-tinta-suave text-sm">
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
