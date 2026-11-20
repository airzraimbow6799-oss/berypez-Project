"use client";

import { X } from "lucide-react";
import { type ReactNode, useId, useLayoutEffect, useRef } from "react";

import { cx } from "./cx";
import { IconButton } from "./IconButton";

export type DialogVariant = "sheet" | "modal" | "drawer";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Texto bajo el título, opcional. */
  description?: string;
  /**
   * - sheet: hoja que sube desde abajo en celular y ventana centrada en escritorio (vista rápida).
   * - modal: ventana centrada siempre.
   * - drawer: panel lateral derecho (carrito).
   */
  variant?: DialogVariant;
  children: ReactNode;
  footer?: ReactNode;
};

const VARIANT_CLASSES: Record<DialogVariant, string> = {
  sheet:
    "mt-auto mb-0 w-full max-w-none rounded-t-lg sm:m-auto sm:max-w-lg sm:rounded-lg max-h-[90dvh]",
  modal: "m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg max-h-[90dvh]",
  drawer: "mr-0 ml-auto h-dvh max-h-none w-full max-w-md rounded-l-lg",
};

/**
 * Diálogo modal sobre <dialog> nativo: el navegador atrapa el foco, cierra con Escape,
 * vuelve inerte el resto de la página y devuelve el foco al cerrar.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = "sheet",
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // useLayoutEffect: el diálogo se abre en el mismo commit; así la foto del plato puede «viajar»
  // a la vista rápida (View Transitions captura el estado final justo después del cambio).
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // El <dialog> queda montado siempre: así close() devuelve el foco al elemento que lo abrió.
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-variant={variant}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera del contenido) cierra.
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={cx(
        "bg-superficie text-marino backdrop:bg-marino/50 p-0 shadow-lg backdrop:backdrop-blur-sm",
        VARIANT_CLASSES[variant],
      )}
    >
      {open ? (
        <div className="flex max-h-[inherit] flex-col">
          <header className="border-borde flex items-start justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 id={titleId} className="text-xl font-semibold">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="text-tinta-suave mt-1 text-sm">
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton
              label="Cerrar"
              icon={<X aria-hidden="true" className="size-6" />}
              onClick={onClose}
            />
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <footer className="border-borde border-t px-5 py-4">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
