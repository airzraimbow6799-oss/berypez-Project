"use client";

import { Eye, Info, Pencil, Plus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { Outcome } from "@/components/panel/carta/backend";
import { DishEditor } from "@/components/panel/carta/DishEditor";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toaster";
import { emptyDishForm } from "@/features/carta/schema";
import { canFeature } from "@/features/promotions/featured";
import { promoBadge } from "@/features/promotions/pricing";
import { previewProducts } from "@/features/promotions/preview";
import {
  emptyPromotionForm,
  type Promotion,
  type PromotionFormInput,
  promotionPreview,
  promotionStatus,
  promotionToForm,
  STATUS_LABELS,
} from "@/features/promotions/schema";
import { formatPrice } from "@/lib/format";
import { PromoCarousel } from "@/components/promotions/PromoCarousel";

import type { PromotionsBackend } from "./backend";
import { PromotionEditor } from "./PromotionEditor";

type EditorState =
  | { kind: "promo"; mode: "crear" | "editar"; id: number | null; initial: PromotionFormInput }
  | { kind: "plato"; draft: PromotionFormInput; returnTo: number | null };

const DATE = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Lima",
});

function dateRange(p: Promotion): string {
  if (!p.startsAt && !p.endsAt) return "Sin fecha de fin";
  if (p.startsAt && p.endsAt)
    return `${DATE.format(Date.parse(p.startsAt))} – ${DATE.format(Date.parse(p.endsAt))}`;
  if (p.endsAt) return `Hasta ${DATE.format(Date.parse(p.endsAt))}`;
  return `Desde ${DATE.format(Date.parse(p.startsAt ?? ""))}`;
}

/**
 * Promociones: porcentaje, precio especial o 2×1 sobre un plato. Las activas salen en la ventana
 * emergente de Inicio (carrusel, la destacada primero), en la franja de la carta y con el precio
 * rebajado en las tarjetas.
 */
export function PromotionsManager({ backend }: { backend: PromotionsBackend }) {
  const { isReady, promotions, dishes } = backend;
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [toDelete, setToDelete] = useState<Promotion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Se calcula una vez por render de la lista: el estado depende de la hora.
  const [now] = useState(() => Date.now());

  const dishById = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const counts = useMemo(() => {
    const byStatus = { activa: 0, programada: 0, pausada: 0, vencida: 0 };
    for (const p of promotions) byStatus[promotionStatus(p, now)] += 1;
    return byStatus;
  }, [promotions, now]);

  const preview = useMemo(
    () => previewProducts(promotions, dishes, now),
    [promotions, dishes, now],
  );

  if (!isReady) {
    return (
      <div className="mt-6" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-6 h-28 w-full" />
      </div>
    );
  }

  const open = (state: EditorState) => {
    setEditorKey((k) => k + 1);
    setEditor(state);
  };

  const report = async (pending: Promise<Outcome>, message: string) => {
    const outcome = await pending;
    if (outcome.ok) toast.success(message);
    else toast.error(outcome.message);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Promociones</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            Las activas salen al entrar a la web (en carrusel, la destacada primero), en la franja
            «Promociones» de la carta y con el precio rebajado.
            {backend.isLive ? " Los cambios se ven en la web al guardar." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secundario"
            disabled={preview.length === 0}
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye aria-hidden="true" className="size-5" /> Ver ventana emergente
          </Button>
          <Button
            onClick={() =>
              open({ kind: "promo", mode: "crear", id: null, initial: emptyPromotionForm() })
            }
          >
            <Plus aria-hidden="true" className="size-5" /> Nueva promoción
          </Button>
        </div>
      </div>

      {backend.isLive ? null : (
        <p
          role="note"
          className="bg-crema-200 border-borde mt-5 flex max-w-3xl gap-3 rounded-md border p-4 text-sm"
        >
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            <strong>Modo demostración:</strong> las promociones se guardan en este navegador y la
            web las muestra aquí mismo: recarga Inicio para ver la ventana emergente. En otros
            dispositivos se ven las de ejemplo hasta que pasemos a cuentas reales.
          </span>
        </p>
      )}

      <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-xl" aria-live="polite">
        <Tile label="Activas" value={counts.activa} />
        <Tile label="Programadas" value={counts.programada} />
        <Tile label="Pausadas o vencidas" value={counts.pausada + counts.vencida} />
      </dl>

      {promotions.length === 0 ? (
        <div className="border-borde mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-lg font-semibold">Todavía no hay promociones</p>
          <p className="text-tinta-suave mt-1">
            Crea la primera: elige un plato, el tipo de promoción y listo.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {promotions.map((promo) => {
            const dish = dishById.get(promo.dishId);
            const status = promotionStatus(promo, now);
            const preview = dish ? promotionPreview(dish, promo) : null;
            const image = promo.image ?? dish?.image ?? null;
            return (
              <li
                key={promo.id}
                className={`border-borde grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-md border p-4 shadow-sm md:grid-cols-[5.5rem_minmax(0,1fr)_auto] md:items-center ${status === "activa" ? "bg-superficie" : "bg-crema-200"}`}
              >
                <div className="bg-crema-200 relative aspect-square overflow-hidden rounded-sm">
                  {image ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="88px"
                      unoptimized={image.url.startsWith("blob:")}
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{promo.title}</h2>
                    <Badge tone="promo">{promoBadge(promo, formatPrice)}</Badge>
                    <Badge tone={status === "activa" ? "vegetariano" : "neutro"}>
                      {STATUS_LABELS[status]}
                    </Badge>
                    {promo.isFeatured ? <Badge tone="favorito">Destacada</Badge> : null}
                  </div>
                  <p className="text-tinta-suave mt-0.5 text-sm">
                    {dish?.name ?? "Plato que ya no está en la carta"} · {dateRange(promo)}
                  </p>
                  {preview && preview.promoCents < preview.regularCents ? (
                    <p className="mt-1 text-sm">
                      <s className="text-tinta-suave">{formatPrice(preview.regularCents)}</s>{" "}
                      <strong>{formatPrice(preview.promoCents)}</strong>
                    </p>
                  ) : null}
                </div>
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 md:col-span-1 md:justify-end">
                  <Switch
                    label={`${promo.title}: activa`}
                    checked={promo.isActive}
                    onText="Activa"
                    offText="Pausada"
                    onChange={(on) =>
                      void report(
                        backend.setFlag(promo, "isActive", on),
                        on ? `«${promo.title}» está activa` : `Pausaste «${promo.title}»`,
                      )
                    }
                  />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label={
                        promo.isFeatured
                          ? "Quitar destacada"
                          : canFeature(promo, now)
                            ? "Destacar: sale primero"
                            : "Solo las promociones activas se pueden destacar"
                      }
                      aria-pressed={promo.isFeatured}
                      disabled={!promo.isFeatured && !canFeature(promo, now)}
                      icon={
                        <Star
                          aria-hidden="true"
                          className={`size-5 ${promo.isFeatured ? "fill-aji" : ""}`}
                        />
                      }
                      onClick={() =>
                        void report(
                          backend.setFlag(promo, "isFeatured", !promo.isFeatured),
                          promo.isFeatured
                            ? `«${promo.title}» ya no es destacada`
                            : `«${promo.title}» es la destacada: sale primero`,
                        )
                      }
                    />
                    <IconButton
                      label={`Editar ${promo.title}`}
                      icon={<Pencil aria-hidden="true" className="size-5" />}
                      onClick={() =>
                        open({
                          kind: "promo",
                          mode: "editar",
                          id: promo.id,
                          initial: promotionToForm(promo),
                        })
                      }
                    />
                    <IconButton
                      label={`Eliminar ${promo.title}`}
                      icon={<Trash2 aria-hidden="true" className="size-5" />}
                      onClick={() => setToDelete(promo)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editor?.kind === "promo" ? (
        <PromotionEditor
          key={editorKey}
          mode={editor.mode}
          initial={editor.initial}
          dishes={dishes}
          onClose={() => setEditor(null)}
          onUpload={backend.uploadPhoto}
          onCreateDish={(draft) => open({ kind: "plato", draft, returnTo: editor.id })}
          onSave={async (input, data) => {
            const outcome = await backend.save(editor.id, input, data);
            if (outcome.ok) {
              toast.success(
                editor.id === null
                  ? `Creaste la promoción «${data.title}»`
                  : `Guardaste «${data.title}»`,
              );
              setEditor(null);
            }
            return outcome;
          }}
        />
      ) : null}

      {editor?.kind === "plato" ? (
        <DishEditor
          key={editorKey}
          open
          mode="crear"
          initial={emptyDishForm("marina")}
          sections={[...new Set(dishes.map((d) => d.section))]}
          onUpload={backend.uploadPhoto}
          onClose={() =>
            open({
              kind: "promo",
              mode: editor.returnTo === null ? "crear" : "editar",
              id: editor.returnTo,
              initial: editor.draft,
            })
          }
          onSave={async (input, data) => {
            const created = await backend.createDish(input, data);
            if (!created.ok) return created;
            toast.success(`Añadiste «${created.dish.name}» a la carta`);
            open({
              kind: "promo",
              mode: editor.returnTo === null ? "crear" : "editar",
              id: editor.returnTo,
              initial: { ...editor.draft, dishId: String(created.dish.id), variantId: "" },
            });
            return { ok: true };
          }}
        />
      ) : null}

      {isPreviewOpen && preview.length > 0 ? (
        <PromoCarousel products={preview} onClose={() => setIsPreviewOpen(false)} />
      ) : null}

      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        variant="modal"
        title="¿Eliminar esta promoción?"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="fantasma" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="peligro"
              onClick={() => {
                if (toDelete) {
                  void report(backend.remove(toDelete), `Eliminaste «${toDelete.title}»`);
                }
                setToDelete(null);
              }}
            >
              Eliminar promoción
            </Button>
          </div>
        }
      >
        <p>
          {toDelete
            ? `«${toDelete.title}» deja de verse en la web. Si solo quieres detenerla un tiempo, mejor páusala.`
            : ""}
        </p>
      </Dialog>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-superficie border-borde rounded-md border px-4 py-3 shadow-sm">
      <dt className="text-tinta-suave text-sm">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
