import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

beforeAll(() => {
  // jsdom no implementa showModal/close.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("Dialog", () => {
  it("cerrar el selector de archivos no cierra el diálogo", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Nueva promoción">
        <input type="file" aria-label="Foto" />
      </Dialog>,
    );
    // El navegador dispara «cancel» en el input al cerrar el selector sin elegir archivo.
    fireEvent(screen.getByLabelText("Foto"), new Event("cancel", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape (cancel del propio diálogo) sí lo cierra", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Nueva promoción">
        <p>Contenido</p>
      </Dialog>,
    );
    fireEvent(
      screen.getByRole("dialog", { hidden: true }),
      new Event("cancel", { cancelable: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
