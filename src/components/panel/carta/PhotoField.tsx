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
 * Foto del plato: subir o cambiar, con vista previa. En el modo demostración la foto vive solo
 * en este navegador (URL temporal); con el backend real se subirá al almacenamiento.
 */
export function PhotoField({
  value,
  dishName,
  onChange,
}: {
  value: DishImage | null;
  dishName: string;
  onChange: (next: DishImage | null) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");

  const pick = (file: File | undefined) => {
    if (!file) return;
    const problem = photoError(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    onChange({ url: URL.createObjectURL(file), alt: dishName });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold" id={`${id}-titulo`}>
        Foto del plato
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
            {value ? "Cambiar foto" : "Subir foto"}
            <input
              id={id}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ""}`}
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value ? (
            <Button variant="fantasma" onClick={() => onChange(null)}>
              <Trash2 aria-hidden="true" className="size-5" /> Quitar foto
            </Button>
          ) : null}
        </div>
      </div>
      <p id={`${id}-ayuda`} className="text-tinta-suave text-sm">
        JPG, PNG o WEBP, hasta 5 MB. Mejor horizontal y con el plato al centro.
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-rocoto-texto text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
