"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { DishImage } from "@/features/carta/schema";

/** Formatos que el navegador muestra bien y que luego se suben a Storage. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function photoError(file: Pick<File, "type" | "size">): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "La foto debe ser JPG, PNG o WEBP.";
  }
  if (file.size > MAX_PHOTO_BYTES) return "La foto pesa más de 5 MB. Usa una más liviana.";
  return null;
}

/**
 * Foto del plato: subir o cambiar, con vista previa. Con `onUpload` (carta real) la foto se
 * achica y se sube al almacenamiento; sin él (modo demostración) vive solo en este navegador.
 */
export function PhotoField({
  value,
  dishName,
  onChange,
  onUpload,
  onBusyChange,
  label = "Foto del plato",
  hint = "JPG, PNG o WEBP, hasta 5 MB. Mejor horizontal y con el plato al centro.",
}: {
  value: DishImage | null;
  dishName: string;
  onChange: (next: DishImage | null) => void;
  onUpload?: (file: File) => Promise<DishImage>;
  onBusyChange?: (busy: boolean) => void;
  label?: string;
  hint?: string;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const problem = photoError(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    if (!onUpload) {
      onChange({ url: URL.createObjectURL(file), alt: dishName });
      return;
    }
    setIsUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await onUpload(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo subir la foto.");
    } finally {
      setIsUploading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold" id={`${id}-titulo`}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-crema-200 relative aspect-[4/3] w-40 overflow-hidden rounded-md">
          {value ? (
            <Image
              src={value.url}
              alt={value.alt || dishName || "Foto del plato"}
              fill
              sizes="160px"
              unoptimized={value.url.startsWith("blob:")}
              className="object-cover"
            />
          ) : (
            <span className="text-tinta-suave absolute inset-0 grid place-items-center text-sm">
              Sin foto
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {/* El input real queda oculto; la etiqueta hace de botón y abre el selector. */}
          <label
            htmlFor={id}
            className="min-h-tactil border-borde hover:border-marino-600 rounded-pill inline-flex cursor-pointer items-center gap-2 border px-4 font-semibold has-[:focus-visible]:outline-3"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
            {isUploading ? "Subiendo foto…" : value ? "Cambiar foto" : "Subir foto"}
            <input
              id={id}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ""}`}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value && !isUploading ? (
            <Button variant="fantasma" onClick={() => onChange(null)}>
              <Trash2 aria-hidden="true" className="size-5" /> Quitar foto
            </Button>
          ) : null}
        </div>
      </div>
      <p id={`${id}-ayuda`} className="text-tinta-suave text-sm">
        {hint}
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
