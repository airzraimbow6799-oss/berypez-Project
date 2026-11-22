"use client";

import { Plus } from "lucide-react";
import { type FormEvent, useId, useMemo, useState } from "react";

import type { Outcome } from "@/components/panel/carta/backend";
import { PhotoField } from "@/components/panel/carta/PhotoField";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FIELD_CONTROL, fieldBorder } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { Dish, DishImage } from "@/features/carta/schema";
import {
  KIND_LABELS,
  parsePromotionForm,
  type PromotionData,
  type PromotionFormInput,
  promotionPreview,
  suggestedTitle,
} from "@/features/promotions/schema";
import { formatPrice } from "@/lib/format";
import { PROMOTION_KINDS } from "@/types/catalog";

/**
 * Formulario de «Nueva promoción» y «Editar promoción». Se monta de nuevo en cada apertura
 * (el padre le cambia la `key`).
 */
export function PromotionEditor({
  mode,
  initial,
  dishes,
  onClose,
  onSave,
  onCreateDish,
  onUpload,
}: {
  mode: "crear" | "editar";
  initial: PromotionFormInput;
  dishes: readonly Dish[];
  onClose: () => void;
  onSave: (input: PromotionFormInput, data: PromotionData) => Promise<Outcome>;
  /** Cierra este formulario y abre el de «Añadir plato»; al guardar, vuelve con el plato elegido. */
  onCreateDish: (draft: PromotionFormInput) => void;
  onUpload?: (file: File) => Promise<DishImage>;
}) {
  const formId = useId();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const set = <K extends keyof PromotionFormInput>(key: K, value: PromotionFormInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const dish = dishes.find((d) => String(d.id) === form.dishId);
  const sorted = useMemo(
    () => [...dishes].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [dishes],
  );
  const preview = useMemo(() => {
    // Con un título provisorio: la vista previa no espera a que escriban uno.
    const parsed = parsePromotionForm(
      { ...form, title: form.title.trim() || "Vista previa" },
      dishes,
    );
    return parsed.ok && dish ? promotionPreview(dish, parsed.data) : null;
  }, [form, dishes, dish]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isUploading) return;
    const parsed = parsePromotionForm(form, dishes);
    if (!parsed.ok) {
      setErrors(parsed.errors);
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

  const errorCount = Object.keys(errors).length;

  return (
    <Dialog
      open
      onClose={onClose}
      variant="modal"
      title={mode === "crear" ? "Nueva promoción" : `Editar «${initial.title}»`}
      description="Sale en la ventana emergente de Inicio, en la franja de la carta y con el precio rebajado."
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
            {mode === "crear" ? "Guardar promoción" : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <NativeSelect
            label="Plato"
            value={form.dishId}
            error={errors.dishId}
            onChange={(v) => setForm((f) => ({ ...f, dishId: v, variantId: "" }))}
          >
            <option value="">Elige un plato de la carta</option>
            {sorted.map((d) => (
              <option key={d.id} value={d.id} disabled={!d.isAvailable}>
                {d.name}
                {d.isAvailable ? "" : " (agotado)"}
              </option>
            ))}
          </NativeSelect>
          <Button variant="fantasma" className="self-start" onClick={() => onCreateDish(form)}>
            <Plus aria-hidden="true" className="size-5" /> Crear plato nuevo
          </Button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold">Tipo de promoción</legend>
          <div className="flex flex-wrap gap-2">
            {PROMOTION_KINDS.map((kind) => (
              <label
                key={kind}
                className="min-h-tactil rounded-pill border-borde has-[:checked]:border-marino has-[:checked]:bg-marino has-[:checked]:text-crema inline-flex cursor-pointer items-center border px-4 text-sm font-semibold has-[:focus-visible]:outline-3"
              >
                <input
                  type="radio"
                  name={`${formId}-tipo`}
                  value={kind}
                  checked={form.kind === kind}
                  onChange={() => set("kind", kind)}
                  className="sr-only"
                />
                {KIND_LABELS[kind]}
              </label>
            ))}
          </div>
        </fieldset>

        {form.kind === "percent" ? (
          <Input
            label="Descuento (%)"
            inputMode="numeric"
            placeholder="20"
            hint="Entre 5 y 90. Se aplica a todas las opciones del plato."
            value={form.percent}
            error={errors.percent}
            onChange={(e) => set("percent", e.target.value)}
          />
        ) : null}

        {form.kind === "fixed_price" ? (
          <>
            {dish?.priceGroup ? (
              <NativeSelect
                label="Opción con precio especial"
                value={form.variantId}
                error={errors.variantId}
                onChange={(v) => set("variantId", v)}
              >
                <option value="">Elige la opción</option>
                {dish.priceGroup.options.map((o) => (
                  <option key={o.id ?? o.label} value={o.id ?? ""}>
                    {o.label} · {formatPrice(o.priceCents)}
                  </option>
                ))}
              </NativeSelect>
            ) : null}
            <Input
              label="Precio de la promoción (S/)"
              inputMode="decimal"
              placeholder="35"
              value={form.price}
              error={errors.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </>
        ) : null}

        {form.kind === "two_for_one" ? (
          <p className="bg-crema-200 rounded-md px-4 py-3 text-sm">
            Por cada 2 unidades del plato, el cliente paga 1. En el carrito se ve la línea de regalo
            y el ticket de cocina la imprime aparte.
          </p>
        ) : null}

        {preview && dish ? (
          <p aria-live="polite" className="border-borde rounded-md border px-4 py-3">
            <span className="text-tinta-suave text-sm">Así se verá: </span>
            {preview.promoCents < preview.regularCents ? (
              <>
                <s className="text-tinta-suave">{formatPrice(preview.regularCents)}</s>{" "}
                <strong className="text-rocoto-texto">{formatPrice(preview.promoCents)}</strong>
              </>
            ) : (
              <strong>{preview.text || formatPrice(preview.regularCents)}</strong>
            )}
          </p>
        ) : null}

        <Input
          label="Título"
          placeholder={suggestedTitle(dish, form) || "Martes de ceviche"}
          hint="Corto: sale en la ventana emergente. Si lo dejas vacío, usamos el sugerido."
          value={form.title}
          error={errors.title}
          onChange={(e) => set("title", e.target.value)}
        />

        <PhotoField
          label="Imagen de la ventana emergente (opcional)"
          hint="Si no subes una, se usa la foto del plato. Mejor horizontal."
          value={form.image}
          fallback={dish?.image ?? null}
          dishName={form.title || dish?.name || ""}
          onChange={(v) => set("image", v)}
          onUpload={onUpload}
          onBusyChange={setIsUploading}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Empieza (opcional)"
            type="datetime-local"
            hint="Vacío: empieza al guardar."
            value={form.startsAt}
            error={errors.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
          <Input
            label="Termina (opcional)"
            type="datetime-local"
            hint="Vacío: sin fecha de fin. Al llegar, se apaga sola."
            value={form.endsAt}
            error={errors.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Switch
            label="Promoción activa"
            checked={form.isActive}
            onChange={(v) => set("isActive", v)}
            onText="Activa"
            offText="Pausada"
          />
          <Switch
            label="Destacada: sale primero en la ventana emergente"
            checked={form.isFeatured}
            onChange={(v) => set("isFeatured", v)}
            onText="Destacada (sale primero)"
            offText="Sin destacar"
          />
        </div>
      </form>
    </Dialog>
  );
}

function NativeSelect({
  label,
  value,
  error,
  onChange,
  children,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_CONTROL} ${fieldBorder(Boolean(error))}`}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
