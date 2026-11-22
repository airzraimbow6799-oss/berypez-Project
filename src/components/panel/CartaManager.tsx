"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useMemo, useState } from "react";

import { DishEditor } from "@/components/panel/carta/DishEditor";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { MENU_LINKS } from "@/config/site";
import {
  filterDishes,
  hasPriceOptions,
  isSoldOut,
  parsePriceInput,
  priceChangeNeedsConfirm,
  summarize,
} from "@/features/carta/logic";
import { type Dish, dishToForm, emptyDishForm, TAG_LABELS } from "@/features/carta/schema";
import { useDemoStore } from "@/features/demo/store";
import type { StaffRole } from "@/features/staff/roles";
import { formatPrice } from "@/lib/format";
import type { MenuSlug } from "@/types/catalog";

/** Centavos a texto editable en soles: 3800 → "38.00". */
const toSoles = (cents: number) => (cents / 100).toFixed(2);

const MENU_LABEL = Object.fromEntries(MENU_LINKS.map((m) => [m.slug, m.label])) as Record<
  MenuSlug,
  string
>;

type EditorState = { mode: "crear" } | { mode: "editar"; dish: Dish };

/**
 * Módulo 2 · Carta administrable (con datos de ejemplo).
 * Administración crea y edita platos (foto, descripción, precio, etiquetas y apartados),
 * cambia precios al vuelo, marca agotados y elimina. Sin stock: un plato está disponible o
 * agotado. Cada cambio se ve al instante y avisa con un mensaje.
 */
export function CartaManager({ role }: { role: StaffRole }) {
  const isReady = useDemoReady();
  const dishes = useDemoStore((s) => s.dishes);
  const setDishPrice = useDemoStore((s) => s.setDishPrice);
  const setDishAvailable = useDemoStore((s) => s.setDishAvailable);
  const addDish = useDemoStore((s) => s.addDish);
  const updateDish = useDemoStore((s) => s.updateDish);
  const removeDish = useDemoStore((s) => s.removeDish);

  const canEditCarta = role === "admin";
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<MenuSlug | null>(null);
  const [onlySoldOut, setOnlySoldOut] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  // Cambia en cada apertura: el formulario se monta de nuevo y arranca limpio.
  const [editorKey, setEditorKey] = useState(0);
  const [toDelete, setToDelete] = useState<Dish | null>(null);
  const [priceToConfirm, setPriceToConfirm] = useState<{ dish: Dish; cents: number } | null>(null);

  const visible = useMemo(
    () => filterDishes(dishes, { query, menu, onlySoldOut }),
    [dishes, query, menu, onlySoldOut],
  );
  const summary = useMemo(() => summarize(dishes), [dishes]);
  const sections = useMemo(
    () => [...new Set(dishes.map((d) => d.section))].sort((a, b) => a.localeCompare(b, "es")),
    [dishes],
  );

  if (!isReady) return <CartaSkeleton />;

  const openEditor = (state: EditorState) => {
    setEditorKey((k) => k + 1);
    setEditor(state);
  };

  const commitPrice = (dish: Dish, cents: number) => {
    setDishPrice(dish.id, cents);
    toast.success(`${dish.name}: ahora cuesta ${formatPrice(cents)}`);
  };

  const requestPrice = (dish: Dish, cents: number) => {
    if (cents === dish.priceCents) return;
    if (priceChangeNeedsConfirm(dish.priceCents, cents)) {
      setPriceToConfirm({ dish, cents });
      return;
    }
    commitPrice(dish, cents);
  };

  const toggleAvailable = (dish: Dish, isAvailable: boolean) => {
    setDishAvailable(dish.id, isAvailable);
    toast.success(isAvailable ? `${dish.name}: disponible` : `${dish.name}: marcado como agotado`);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Carta</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            {canEditCarta
              ? "Crea y edita platos con su foto, etiquetas y apartados. Marca agotado lo que se acabe."
              : "Marca los platos agotados. Los precios y los platos los cambia la administración."}
          </p>
        </div>
        {canEditCarta ? (
          <Button onClick={() => openEditor({ mode: "crear" })}>
            <Plus aria-hidden="true" className="size-5" /> Añadir plato
          </Button>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-xl" aria-live="polite">
        <SummaryTile label="Platos" value={summary.total} />
        <SummaryTile label="Agotados" value={summary.soldOut} tone="alerta" />
        <SummaryTile label="Con apartados" value={summary.withOptions} />
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        <SearchField value={query} onChange={setQuery} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de la carta">
          <Chip pressed={menu === null} onPressedChange={() => setMenu(null)}>
            Todas las cartas
          </Chip>
          {MENU_LINKS.map((m) => (
            <Chip
              key={m.slug}
              pressed={menu === m.slug}
              onPressedChange={(on) => setMenu(on ? m.slug : null)}
            >
              {m.label}
            </Chip>
          ))}
          <Chip pressed={onlySoldOut} onPressedChange={setOnlySoldOut}>
            Solo agotados
          </Chip>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border-borde mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-lg font-semibold">No hay platos con ese filtro</p>
          <p className="text-tinta-suave mt-1">
            Prueba con otra palabra o quita los filtros para ver toda la carta.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {visible.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              canEditCarta={canEditCarta}
              onPrice={(cents) => requestPrice(dish, cents)}
              onAvailable={(on) => toggleAvailable(dish, on)}
              onEdit={() => openEditor({ mode: "editar", dish })}
              onDelete={() => setToDelete(dish)}
            />
          ))}
        </ul>
      )}

      {editor ? (
        <DishEditor
          key={editorKey}
          open
          mode={editor.mode}
          initial={
            editor.mode === "editar" ? dishToForm(editor.dish) : emptyDishForm(menu ?? "marina")
          }
          sections={sections}
          onClose={() => setEditor(null)}
          onSave={(data) => {
            if (editor.mode === "editar") {
              updateDish(editor.dish.id, data);
              toast.success(`Guardaste los cambios de «${data.name}»`);
            } else {
              const dish = addDish(data);
              toast.success(`Añadiste «${dish.name}» a la carta`);
            }
            setEditor(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar este plato?"
        message={
          toDelete
            ? `«${toDelete.name}» saldrá de la carta. Los pedidos que ya se hicieron no cambian.`
            : ""
        }
        confirmLabel="Eliminar plato"
        tone="peligro"
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            removeDish(toDelete.id);
            toast.success(`Eliminaste «${toDelete.name}»`);
          }
          setToDelete(null);
        }}
      />

      <ConfirmDialog
        open={priceToConfirm !== null}
        title="Es un cambio grande de precio"
        message={
          priceToConfirm
            ? `«${priceToConfirm.dish.name}» pasaría de ${formatPrice(priceToConfirm.dish.priceCents)} a ${formatPrice(priceToConfirm.cents)}. ¿Es correcto?`
            : ""
        }
        confirmLabel="Sí, cambiar el precio"
        onClose={() => setPriceToConfirm(null)}
        onConfirm={() => {
          if (priceToConfirm) commitPrice(priceToConfirm.dish, priceToConfirm.cents);
          setPriceToConfirm(null);
        }}
      />
    </div>
  );
}

/**
 * Buscador con lupa. La lupa se centra respecto del campo (no de la etiqueta), por eso el
 * contenedor `relative` envuelve solo el input.
 */
function SearchField({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const id = useId();
  return (
    <div className="max-w-md">
      <label htmlFor={id} className="font-semibold">
        Buscar plato
      </label>
      <div className="relative mt-1.5">
        <Search
          aria-hidden="true"
          className="text-tinta-suave pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-tactil bg-superficie text-marino border-borde hover:border-marino-600 focus-visible:border-marino-600 w-full rounded-sm border pr-4 pl-12 text-base"
        />
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: "alerta" }) {
  return (
    <div className="bg-superficie border-borde rounded-md border px-4 py-3 shadow-sm">
      <dt className="text-tinta-suave text-sm">{label}</dt>
      <dd
        className={`text-2xl font-semibold tabular-nums ${tone === "alerta" && value > 0 ? "text-rocoto-texto" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function DishRow({
  dish,
  canEditCarta,
  onPrice,
  onAvailable,
  onEdit,
  onDelete,
}: {
  dish: Dish;
  canEditCarta: boolean;
  onPrice: (cents: number) => void;
  onAvailable: (isAvailable: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const soldOut = isSoldOut(dish);
  const optionCount = (dish.priceGroup ? 1 : 0) + dish.choiceGroups.length;
  const where = `${dish.menus.map((m) => MENU_LABEL[m]).join(" · ")} — ${dish.section}`;
  const options =
    optionCount > 0 ? ` · ${optionCount} ${optionCount === 1 ? "apartado" : "apartados"}` : "";

  return (
    <li
      className={`border-borde grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-md border p-4 shadow-sm md:grid-cols-[5.5rem_minmax(0,1fr)_auto_auto] md:items-center ${soldOut ? "bg-crema-200" : "bg-superficie"}`}
    >
      <div className="bg-crema-200 relative aspect-square overflow-hidden rounded-sm">
        {dish.image ? (
          <Image
            src={dish.image.url}
            alt=""
            fill
            sizes="88px"
            unoptimized={dish.image.url.startsWith("blob:")}
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{dish.name}</h2>
          {soldOut ? <Badge tone="agotado">Agotado</Badge> : null}
        </div>
        <p className="text-tinta-suave mt-0.5 text-sm">
          {where}
          {options}
        </p>
        {dish.tags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {dish.tags.map((tag) => (
              <Badge key={tag}>{TAG_LABELS[tag]}</Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="col-span-2 md:col-span-1">
        {canEditCarta && !hasPriceOptions(dish) ? (
          <PriceField dish={dish} onCommit={onPrice} />
        ) : (
          <p className="text-lg font-semibold tabular-nums md:text-right">
            {dish.priceGroup ? "Desde " : ""}
            {formatPrice(dish.priceCents)}
          </p>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-1 md:justify-end">
        <AvailabilitySwitch name={dish.name} checked={!soldOut} onChange={onAvailable} />
        {canEditCarta ? (
          <div className="flex items-center gap-1">
            <IconButton
              label={`Editar ${dish.name}`}
              icon={<Pencil aria-hidden="true" className="size-5" />}
              onClick={onEdit}
            />
            <IconButton
              label={`Eliminar ${dish.name}`}
              icon={<Trash2 aria-hidden="true" className="size-5" />}
              onClick={onDelete}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

/** Precio en soles; se guarda al salir del campo o con Enter, y Escape lo deja como estaba. */
function PriceField({ dish, onCommit }: { dish: Dish; onCommit: (cents: number) => void }) {
  const id = useId();
  const [text, setText] = useState(toSoles(dish.priceCents));
  const [error, setError] = useState("");
  const [lastCents, setLastCents] = useState(dish.priceCents);

  // Si el precio cambia desde fuera (confirmación, edición, reinicio), el campo lo refleja.
  if (lastCents !== dish.priceCents) {
    setLastCents(dish.priceCents);
    setText(toSoles(dish.priceCents));
    setError("");
  }

  const commit = () => {
    const result = parsePriceInput(text);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    if (result.cents === dish.priceCents) {
      setText(toSoles(dish.priceCents));
      return;
    }
    onCommit(result.cents);
    // Si el cambio pide confirmación y se rechaza, el campo vuelve al valor guardado.
    setText(toSoles(dish.priceCents));
  };

  return (
    <div className="flex flex-col gap-1 md:w-36">
      <label htmlFor={id} className="text-tinta-suave text-sm font-semibold">
        Precio (S/)
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={text}
        aria-invalid={error !== ""}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setText(toSoles(dish.priceCents));
            setError("");
            e.currentTarget.blur();
          }
        }}
        className={`min-h-tactil bg-superficie rounded-sm border px-3 text-base tabular-nums ${error ? "border-rocoto-texto" : "border-borde hover:border-marino-600"}`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Interruptor accesible (role=switch). El estado se dice con texto, no solo con color. */
function AvailabilitySwitch({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${name}: disponible`}
      onClick={() => onChange(!checked)}
      className="min-h-tactil rounded-pill inline-flex items-center gap-3 pr-1"
    >
      <span
        aria-hidden="true"
        className={`relative inline-block h-7 w-12 rounded-full transition-colors duration-150 ${checked ? "bg-limon-texto" : "bg-tinta-suave/60"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? "translate-x-5" : ""}`}
        />
      </span>
      <span className="w-20 text-left text-sm font-semibold">
        {checked ? "Disponible" : "Agotado"}
      </span>
    </button>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = "primario",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "primario" | "peligro";
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      title={title}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="fantasma" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={tone} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}

function CartaSkeleton() {
  return (
    <div className="mt-6" aria-busy="true">
      <Skeleton className="h-9 w-40" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
