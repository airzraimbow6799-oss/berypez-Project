"use client";

import { AlertTriangle, CupSoda, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { cartSubtotalCents, lineTotalCents, paidUnits } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";
import { useQuote } from "@/features/cart/use-quote";
import { useOrderMode } from "@/features/order-mode/use-order-mode";
import { formatPrice } from "@/lib/format";

function useSessionMode() {
  return useOrderMode()[0];
}

/** F2-08 · Carrito: edición de cantidades, total real del servidor y avisos de cambios. */
export function CartView() {
  const { lines, setQuantity, remove } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const mode = useSessionMode();

  const quote = useQuote(lines, {
    modality: "pickup",
    branchSlug: mode?.modality === "pickup" ? mode.branch : "lince",
    district: "",
  });

  if (!isMounted) {
    return (
      <div className="mt-6 space-y-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border-borde bg-superficie mt-6 rounded-md border p-8 text-center">
        <p className="text-xl font-semibold">Tu carrito está vacío.</p>
        <p className="text-tinta-suave mt-1">¿Qué se te antoja hoy?</p>
        <Button href="/carta/marina" className="mt-5">
          Ver la carta
        </Button>
      </div>
    );
  }

  const subtotal = quote.status === "ready" ? quote.quote.subtotalCents : cartSubtotalCents(lines);
  const issues = quote.status === "ready" ? quote.quote.issues : [];
  const changed =
    quote.status === "ready" &&
    quote.quote.subtotalCents !== cartSubtotalCents(lines) &&
    issues.length === 0;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-3">
        {lines.map((line, index) => {
          const issue = issues.find((i) => i.index === index);
          return (
            <li
              key={line.key}
              className="border-borde bg-superficie flex gap-3 rounded-md border p-3 shadow-sm"
            >
              {line.imageUrl ? (
                <span className="relative size-20 shrink-0 overflow-hidden rounded-sm">
                  <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </span>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-semibold">
                  {line.name}
                  {line.variantLabel ? (
                    <span className="text-tinta-suave font-normal"> · {line.variantLabel}</span>
                  ) : null}
                </p>
                {Object.values(line.choices).length > 0 ? (
                  <p className="text-tinta-suave text-sm">
                    {Object.values(line.choices).join(", ")}
                  </p>
                ) : null}
                {line.note ? <p className="text-tinta-suave text-sm">Nota: {line.note}</p> : null}
                {line.twoForOne ? (
                  <p className="text-rocoto-texto text-sm font-semibold">
                    Promoción 2×1: pagas {paidUnits(line)} de {line.quantity}
                    {line.quantity === 1 ? " (agrega otro, el segundo es gratis)" : ""}
                  </p>
                ) : null}
                {issue ? (
                  <p
                    role="alert"
                    className="text-rocoto-texto flex items-center gap-1 text-sm font-semibold"
                  >
                    <AlertTriangle aria-hidden="true" className="size-4" />
                    {issue.message}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <Stepper
                    value={line.quantity}
                    onChange={(quantity) => setQuantity(line.key, quantity)}
                    itemName={line.name}
                  />
                  <span className="font-semibold tabular-nums">
                    {formatPrice(lineTotalCents(line))}
                  </span>
                </div>
              </div>
              <IconButton
                label={`Quitar ${line.name}`}
                icon={<Trash2 aria-hidden="true" className="size-5" />}
                onClick={() => remove(line.key)}
                className="self-start"
              />
            </li>
          );
        })}
        <li>
          <Link
            href="/carta/el-bar"
            className="border-borde text-marino hover:border-marino-600 min-h-tactil flex items-center gap-2 rounded-md border border-dashed px-4 py-3 font-semibold"
          >
            <CupSoda aria-hidden="true" className="size-5" />
            ¿Algo para tomar? Chicha, limonada, pisco sour…
          </Link>
        </li>
      </ul>

      <aside
        aria-label="Resumen"
        className="lg:sticky lg:top-[calc(var(--altura-header)+1rem)] lg:self-start"
      >
        <div className="border-borde bg-superficie rounded-md border p-5 shadow-sm">
          <dl className="flex justify-between text-lg">
            <dt>Subtotal</dt>
            <dd className="font-semibold tabular-nums" aria-live="polite">
              {formatPrice(subtotal)}
            </dd>
          </dl>
          <p className="text-tinta-suave mt-1 text-sm">
            El envío se calcula en el siguiente paso según tu distrito.
          </p>
          {changed ? (
            <p role="status" className="bg-aji-100 mt-3 rounded-sm p-3 text-sm">
              Algunos precios cambiaron. El total ya está actualizado.
            </p>
          ) : null}
          {quote.status === "error" ? (
            <p role="alert" className="text-rocoto-texto mt-3 text-sm font-semibold">
              {quote.message}
            </p>
          ) : null}
          <Button href="/checkout" size="lg" className="mt-4 w-full">
            Continuar
          </Button>
          <Button href="/carta/marina" variant="fantasma" className="mt-2 w-full">
            Seguir pidiendo
          </Button>
        </div>
      </aside>
    </div>
  );
}
