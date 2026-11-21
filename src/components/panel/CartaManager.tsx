"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { type FormEvent, useId, useMemo, useState } from "react";

import { useDemoReady } from "@/components/panel/useDemoReady";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import {
  canMarkAvailable,
  filterDishes,
  isSoldOut,
  LOW_STOCK_THRESHOLD,
  parsePriceInput,
  parseStockInput,
  priceChangeNeedsConfirm,
  summarize,
} from "@/features/carta/logic";
import {
  DISH_CATEGORIES,
  type Dish,
  type NewDishFormInput,
  newDishFormSchema,
} from "@/features/carta/schema";
import { useDemoStore } from "@/features/demo/store";
import type { StaffRole } from "@/features/staff/roles";
import { formatPrice } from "@/lib/format";

/** Centavos a texto editable en soles: 3800 → "38.00". */
const toSoles = (cents: number) => (cents / 100).toFixed(2);

/**
 * Módulo 2 · Carta administrable (con datos de ejemplo).
 * Administración cambia precios, añade y elimina platos; cocina solo marca agotados y ajusta
 * el stock. Cada cambio se ve al instante y avisa con un mensaje.
 */
export function CartaManager({ role }: { role: StaffRole }) {
  const isReady = useDemoReady();
  const dishes = useDemoStore((s) => s.dishes);
  const setDishPrice = useDemoStore((s) => s.setDishPrice);
  const setDishAvailable = useDemoStore((s) => s.setDishAvailable);
  const setDishStock = useDemoStore((s) => s.setDishStock);
  const addDish = useDemoStore((s) => s.addDish);
  const removeDish = useDemoStore((s) => s.removeDish);

  const canEditCarta = role === "admin";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [onlySoldOut, setOnlySoldOut] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Dish | null>(null);
  const [priceToConfirm, setPriceToConfirm] = useState<{ dish: Dish; cents: number } | null>(null);

  const visible = useMemo(
    () => filterDishes(dishes, { query, category, onlySoldOut }),
    [dishes, query, category, onlySoldOut],
  );
  const summary = useMemo(() => summarize(dishes), [dishes]);

  if (!isReady) return <CartaSkeleton />;

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

  const changeStock = (dish: Dish, qty: number | null) => {
    if (qty === dish.stockQty) return;
    setDishStock(dish.id, qty);
    toast.success(
      qty === null
        ? `${dish.name}: sin control de stock`
        : qty === 0
          ? `${dish.name}: sin stock, queda agotado`
          : `${dish.name}: quedan ${qty}`,
    );
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Carta</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            {canEditCarta
              ? "Cambia precios, marca platos agotados y controla el stock. Cada cambio se ve al instante."
              : "Marca los platos agotados y ajusta el stock. Los precios los cambia la administración."}
          </p>
        </div>
        {canEditCarta ? (
          <Button onClick={() => setIsAdding(true)}>
            <Plus aria-hidden="true" className="size-5" /> Añadir plato
          </Button>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-xl" aria-live="polite">
        <SummaryTile label="Platos" value={summary.total} />
        <SummaryTile label="Agotados" value={summary.soldOut} tone="alerta" />
        <SummaryTile label="Poco stock" value={summary.lowStock} />
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        <SearchField value={query} onChange={setQuery} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de la carta">
          <Chip pressed={category === null} onPressedChange={() => setCategory(null)}>
            Todos
          </Chip>
          {DISH_CATEGORIES.map((name) => (
            <Chip
              key={name}
              pressed={category === name}
              onPressedChange={(on) => setCategory(on ? name : null)}
            >
              {name}
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
              onStock={(qty) => changeStock(dish, qty)}
              onDelete={() => setToDelete(dish)}
            />
          ))}
        </ul>
      )}

      <AddDishDialog
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onAdd={(form) => {
          const dish = addDish(form);
          toast.success(`Añadiste «${dish.name}» a la carta`);
          setIsAdding(false);
        }}
      />

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
  onStock,
  onDelete,
}: {
  dish: Dish;
  canEditCarta: boolean;
  onPrice: (cents: number) => void;
  onAvailable: (isAvailable: boolean) => void;
  onStock: (qty: number | null) => void;
  onDelete: () => void;
}) {
  const soldOut = isSoldOut(dish);
  const isLow = !soldOut && dish.stockQty !== null && dish.stockQty <= LOW_STOCK_THRESHOLD;

  return (
    <li
      className={`bg-superficie border-borde grid gap-4 rounded-md border p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center ${soldOut ? "bg-crema-200" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{dish.name}</h2>
          <Badge>{dish.category}</Badge>
          {soldOut ? <Badge tone="agotado">Agotado</Badge> : null}
          {isLow ? <Badge tone="promo">Quedan {dish.stockQty}</Badge> : null}
        </div>
        <p className="text-tinta-suave mt-1 text-sm">{dish.description}</p>
      </div>

      {canEditCarta ? (
        <PriceField dish={dish} onCommit={onPrice} />
      ) : (
        <p className="text-lg font-semibold tabular-nums md:text-right">
          {formatPrice(dish.priceCents)}
        </p>
      )}

      <StockField dish={dish} onCommit={onStock} />

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <AvailabilitySwitch
          name={dish.name}
          checked={!soldOut}
          disabled={!canMarkAvailable(dish) && soldOut}
          onChange={onAvailable}
        />
        {canEditCarta ? (
          <IconButton
            label={`Eliminar ${dish.name}`}
            icon={<Trash2 aria-hidden="true" className="size-5" />}
            onClick={onDelete}
          />
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

  // Si el precio cambia desde fuera (confirmación, reinicio), el campo lo refleja.
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

/** Stock opcional: vacío = sin control. Se guarda al salir del campo o con Enter. */
function StockField({ dish, onCommit }: { dish: Dish; onCommit: (qty: number | null) => void }) {
  const id = useId();
  const [text, setText] = useState(dish.stockQty === null ? "" : String(dish.stockQty));
  const [error, setError] = useState("");
  const [lastQty, setLastQty] = useState(dish.stockQty);

  if (lastQty !== dish.stockQty) {
    setLastQty(dish.stockQty);
    setText(dish.stockQty === null ? "" : String(dish.stockQty));
    setError("");
  }

  const commit = () => {
    const result = parseStockInput(text);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    onCommit(result.qty);
  };

  return (
    <div className="flex flex-col gap-1 md:w-32">
      <label htmlFor={id} className="text-tinta-suave text-sm font-semibold">
        Stock
      </label>
      <input
        id={id}
        inputMode="numeric"
        placeholder="Sin límite"
        value={text}
        aria-invalid={error !== ""}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
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
  disabled,
  onChange,
}: {
  name: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${name}: disponible`}
      disabled={disabled}
      title={disabled ? "Sin stock: repón unidades para volver a venderlo" : undefined}
      onClick={() => onChange(!checked)}
      className="min-h-tactil rounded-pill inline-flex items-center gap-3 pr-1 disabled:cursor-not-allowed disabled:opacity-60"
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

function AddDishDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (form: ReturnType<typeof newDishFormSchema.parse>) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: NewDishFormInput = {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      category: String(data.get("category") ?? "") as NewDishFormInput["category"],
      price: String(data.get("price") ?? ""),
      stock: String(data.get("stock") ?? ""),
    };
    const parsed = newDishFormSchema.safeParse(input);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onAdd(parsed.data);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setErrors({});
        onClose();
      }}
      variant="modal"
      title="Añadir plato"
      description="Aparece en la carta al guardar."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="fantasma" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Guardar plato
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input label="Nombre" name="name" required error={errors.name} autoComplete="off" />
        <Select
          label="Categoría"
          name="category"
          required
          placeholder="Elige una categoría"
          options={DISH_CATEGORIES.map((name) => ({ value: name, label: name }))}
          error={errors.category}
        />
        <Input
          label="Precio (S/)"
          name="price"
          required
          inputMode="decimal"
          hint="Por ejemplo 38 o 38.50"
          error={errors.price}
        />
        <Input
          label="Stock"
          name="stock"
          inputMode="numeric"
          hint="Déjalo vacío si no controlas la cantidad."
          error={errors.stock}
        />
        <Input label="Descripción" name="description" error={errors.description} />
      </form>
    </Dialog>
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
