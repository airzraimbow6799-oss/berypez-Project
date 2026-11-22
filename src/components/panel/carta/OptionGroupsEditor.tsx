"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { type DishFormInput, MAX_CHOICE_GROUPS, MAX_OPTIONS } from "@/features/carta/schema";

type PriceGroupInput = NonNullable<DishFormInput["priceGroup"]>;
type ChoiceGroupInput = DishFormInput["choiceGroups"][number];
type Errors = Record<string, string>;

const replaceAt = <T,>(list: readonly T[], index: number, value: T): T[] =>
  list.map((item, i) => (i === index ? value : item));
const removeAt = <T,>(list: readonly T[], index: number): T[] => list.filter((_, i) => i !== index);

/**
 * Apartado con precio («Elige tu chicharrón»): cada opción tiene su propio precio y el cliente
 * elige una. Si el plato tiene precio único, este apartado no se usa.
 */
export function PriceGroupEditor({
  value,
  errors,
  onChange,
}: {
  value: PriceGroupInput | null;
  errors: Errors;
  onChange: (next: PriceGroupInput | null) => void;
}) {
  if (value === null) {
    return (
      <GroupShell
        title="Apartado con precio"
        hint="Úsalo cuando el precio cambia según lo que elija el cliente: el pescado, el tamaño, el tipo de chicharrón."
      >
        <Button
          variant="secundario"
          onClick={() =>
            onChange({
              label: "",
              options: [
                { label: "", price: "" },
                { label: "", price: "" },
              ],
            })
          }
        >
          <Plus aria-hidden="true" className="size-5" /> Agregar apartado con precio
        </Button>
      </GroupShell>
    );
  }

  const setOption = (index: number, patch: Partial<PriceGroupInput["options"][number]>) =>
    onChange({
      ...value,
      options: replaceAt(value.options, index, { ...value.options[index]!, ...patch }),
    });

  return (
    <GroupShell
      title="Apartado con precio"
      hint="El precio que se muestra en la carta será «desde» la opción más barata."
      onRemove={() => onChange(null)}
      removeLabel="Quitar apartado con precio"
    >
      <Input
        label="Título del apartado"
        placeholder="Elige tu pescado"
        value={value.label}
        error={errors["priceGroup.label"]}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Opciones</legend>
        {value.options.map((option, index) => (
          <div
            // El orden de las opciones solo cambia al quitar una; el índice basta como clave.
            key={index}
            // En celular el nombre va en su propia fila y el precio debajo; en pantallas anchas, juntos.
            className="border-borde grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b pb-3 last-of-type:border-0 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:border-0 sm:pb-0"
          >
            <div className="col-span-2 sm:col-span-1">
              <Input
                label={`Opción ${index + 1}`}
                placeholder="Pesca del día"
                value={option.label}
                error={errors[`priceGroup.options.${index}.label`]}
                onChange={(e) => setOption(index, { label: e.target.value })}
              />
            </div>
            <Input
              label="Precio (S/)"
              inputMode="decimal"
              placeholder="40"
              value={option.price}
              error={errors[`priceGroup.options.${index}.price`]}
              onChange={(e) => setOption(index, { price: e.target.value })}
            />
            <RemoveOption
              label={`Quitar opción ${index + 1}`}
              disabled={value.options.length <= 2}
              onClick={() => onChange({ ...value, options: removeAt(value.options, index) })}
            />
          </div>
        ))}
        <GroupError message={errors["priceGroup.options"]} />
        {value.options.length < MAX_OPTIONS ? (
          <Button
            variant="fantasma"
            className="self-start"
            onClick={() =>
              onChange({ ...value, options: [...value.options, { label: "", price: "" }] })
            }
          >
            <Plus aria-hidden="true" className="size-5" /> Agregar opción
          </Button>
        ) : null}
      </fieldset>
    </GroupShell>
  );
}

/**
 * Apartados sin precio («Elige el tipo»: Filete 200 g o Entero 550 g). Son instrucciones para
 * cocina: no cambian el precio. Puede haber varios o ninguno.
 */
export function ChoiceGroupsEditor({
  value,
  errors,
  onChange,
}: {
  value: ChoiceGroupInput[];
  errors: Errors;
  onChange: (next: ChoiceGroupInput[]) => void;
}) {
  const setGroup = (index: number, group: ChoiceGroupInput) =>
    onChange(replaceAt(value, index, group));

  return (
    <div className="flex flex-col gap-4">
      {value.map((group, gi) => (
        <GroupShell
          key={gi}
          title={`Apartado sin precio ${value.length > 1 ? gi + 1 : ""}`.trim()}
          hint="El cliente elige una opción; no cambia el precio."
          onRemove={() => onChange(removeAt(value, gi))}
          removeLabel={`Quitar apartado sin precio ${gi + 1}`}
        >
          <Input
            label="Título del apartado"
            placeholder="Elige el tipo"
            value={group.label}
            error={errors[`choiceGroups.${gi}.label`]}
            onChange={(e) => setGroup(gi, { ...group, label: e.target.value })}
          />
          <fieldset className="flex flex-col gap-3">
            <legend className="font-semibold">Opciones</legend>
            {group.options.map((option, oi) => (
              <div key={oi} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <Input
                  label={`Opción ${oi + 1}`}
                  placeholder="Filete de pescado 200 GR"
                  value={option}
                  error={errors[`choiceGroups.${gi}.options.${oi}`]}
                  onChange={(e) =>
                    setGroup(gi, {
                      ...group,
                      options: replaceAt(group.options, oi, e.target.value),
                    })
                  }
                />
                <RemoveOption
                  label={`Quitar opción ${oi + 1} de «${group.label || "apartado"}»`}
                  disabled={group.options.length <= 2}
                  onClick={() => setGroup(gi, { ...group, options: removeAt(group.options, oi) })}
                />
              </div>
            ))}
            <GroupError message={errors[`choiceGroups.${gi}.options`]} />
            {group.options.length < MAX_OPTIONS ? (
              <Button
                variant="fantasma"
                className="self-start"
                onClick={() => setGroup(gi, { ...group, options: [...group.options, ""] })}
              >
                <Plus aria-hidden="true" className="size-5" /> Agregar opción
              </Button>
            ) : null}
          </fieldset>
        </GroupShell>
      ))}
      {value.length < MAX_CHOICE_GROUPS ? (
        <Button
          variant="secundario"
          className="self-start"
          onClick={() => onChange([...value, { label: "", options: ["", ""] }])}
        >
          <Plus aria-hidden="true" className="size-5" /> Agregar apartado sin precio
        </Button>
      ) : null}
    </div>
  );
}

function GroupShell({
  title,
  hint,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  hint: string;
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-borde bg-crema-100 flex flex-col gap-3 rounded-md border p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-tinta-suave text-sm">{hint}</p>
        </div>
        {onRemove ? (
          <IconButton
            label={removeLabel ?? "Quitar apartado"}
            icon={<X aria-hidden="true" className="size-5" />}
            onClick={onRemove}
          />
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** Botón de quitar alineado con el campo (la etiqueta del campo ocupa la primera línea). */
function RemoveOption({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pt-8">
      <IconButton
        label={label}
        icon={<X aria-hidden="true" className="size-5" />}
        disabled={disabled}
        onClick={onClick}
      />
    </div>
  );
}

function GroupError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-rocoto-texto text-sm font-semibold">
      {message}
    </p>
  );
}
