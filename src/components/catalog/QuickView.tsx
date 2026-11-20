"use client";

import Image from "next/image";
import { type MouseEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Stepper } from "@/components/ui/Stepper";
import { toast } from "@/components/ui/Toaster";
import { flyToCart } from "@/features/cart/fly-to-cart";
import { PLATO_FOTO } from "@/features/motion/view-transition";
import { useCart } from "@/features/cart/store";
import {
  canAddToCart,
  defaultSelection,
  missingChoices,
  type Selection,
  toCartInput,
  unitPriceCents,
  visibleChoiceGroups,
} from "@/features/catalog/selection";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

type OptionProps = {
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** Opción grande (botón de radio nativo con apariencia de tarjeta): accesible por teclado. */
function Option({ name, value, label, hint, checked, disabled, onSelect }: OptionProps) {
  return (
    <label
      className={`min-h-tactil flex cursor-pointer items-center justify-between gap-3 rounded-sm border px-4 py-2 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-foco)] ${
        checked ? "border-marino bg-aji-100" : "border-borde hover:border-marino-600"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="flex items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onSelect}
          className="accent-marino size-5"
        />
        <span className="font-semibold">{label}</span>
      </span>
      {hint ? <span className="text-tinta-suave text-sm tabular-nums">{hint}</span> : null}
    </label>
  );
}

function QuickViewBody({
  product,
  previewSrc,
  onAdded,
}: {
  product: Product;
  previewSrc: string | null;
  onAdded: () => void;
}) {
  const add = useCart((state) => state.add);
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product));
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const groups = visibleChoiceGroups(product, selection.variantId);
  const missing = missingChoices(product, selection.variantId, selection.choices);
  const unit = unitPriceCents(product, selection.variantId);
  const isAddable = canAddToCart(product, selection);
  const hasVariants = product.variants.length > 1;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    add(toCartInput(product, selection, note), quantity);
    flyToCart(event.currentTarget, product.image?.url);
    toast.success(`Agregaste ${quantity} × ${product.name}`, {
      action: { label: "Ver carrito", onClick: () => window.location.assign("/carrito") },
    });
    onAdded();
  };

  return (
    <div className="flex flex-col gap-5">
      {product.image ? (
        <div
          className="relative -mx-5 -mt-4 aspect-[16/10] overflow-hidden"
          style={{ viewTransitionName: PLATO_FOTO }}
        >
          {/* La foto que la tarjeta ya tenía (caché): aparece al instante, sin hueco en blanco. */}
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt=""
              fill
              unoptimized
              loading="eager"
              aria-hidden="true"
              className="object-cover"
            />
          ) : null}
          {/* La grande, con prioridad (no espera a «cuando se necesite»): cubre a la de arriba al llegar. */}
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority
            sizes="(min-width: 640px) 512px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {product.description ? <p className="text-tinta-suave">{product.description}</p> : null}

      {hasVariants ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-semibold">
            {product.variantLabel ?? "Elige una opción"}
          </legend>
          {product.variants.map((variant) => (
            <Option
              key={variant.id}
              name={`variante-${product.id}`}
              value={String(variant.id)}
              label={variant.label}
              hint={variant.isAvailable ? formatPrice(variant.priceCents) : "Agotado"}
              checked={selection.variantId === variant.id}
              disabled={!variant.isAvailable}
              onSelect={() => setSelection((s) => ({ ...s, variantId: variant.id }))}
            />
          ))}
        </fieldset>
      ) : null}

      {groups.map((group) => (
        <fieldset key={group.key} className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-semibold">{group.label}</legend>
          {group.options.map((option) => (
            <Option
              key={option}
              name={`${product.id}-${group.key}`}
              value={option}
              label={option}
              checked={selection.choices[group.key] === option}
              onSelect={() =>
                setSelection((s) => ({ ...s, choices: { ...s.choices, [group.key]: option } }))
              }
            />
          ))}
        </fieldset>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`nota-${product.id}`} className="font-semibold">
          Nota para cocina <span className="text-tinta-suave font-normal">(opcional)</span>
        </label>
        <textarea
          id={`nota-${product.id}`}
          value={note}
          maxLength={200}
          rows={2}
          placeholder="Ejemplo: sin culantro, ají aparte"
          onChange={(event) => setNote(event.target.value)}
          className="border-borde bg-superficie focus-visible:border-marino-600 w-full rounded-sm border px-4 py-3"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">Cantidad</span>
        <Stepper value={quantity} onChange={setQuantity} itemName={product.name} />
      </div>

      <div className="bg-superficie border-borde sticky bottom-0 -mx-5 -mb-4 border-t px-5 py-4">
        {missing.length > 0 ? (
          <p className="text-tinta-suave mb-2 text-sm" aria-live="polite">
            Falta: {missing.join(", ").toLowerCase()}
          </p>
        ) : null}
        <Button className="w-full" size="lg" disabled={!isAddable} onClick={handleAdd}>
          {product.isAvailable ? `Agregar · ${formatPrice(unit * quantity)}` : "Agotado"}
        </Button>
      </div>
    </div>
  );
}

/** F1-10 · Vista rápida: hoja inferior en celular, ventana en escritorio. */
export function QuickView({
  product,
  previewSrc = null,
  onClose,
}: {
  product: Product | null;
  /** URL de la foto ya cargada en la tarjeta, para mostrarla sin esperar. */
  previewSrc?: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={product !== null} onClose={onClose} title={product?.name ?? ""} variant="sheet">
      {product ? (
        <QuickViewBody
          key={product.id}
          product={product}
          previewSrc={previewSrc}
          onAdded={onClose}
        />
      ) : null}
    </Dialog>
  );
}
