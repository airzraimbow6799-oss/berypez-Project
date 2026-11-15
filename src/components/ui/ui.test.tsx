import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Dialog } from "./Dialog";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { Select } from "./Select";
import { Skeleton } from "./Skeleton";
import { Stepper } from "./Stepper";

// jsdom no implementa <dialog>.showModal(): se emula lo mínimo.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
});

describe("Button", () => {
  it("es un botón type=button por defecto y ejecuta onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Pedir ahora</Button>);
    const button = screen.getByRole("button", { name: "Pedir ahora" });
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("se renderiza como enlace cuando recibe href", () => {
    render(<Button href="/carta/marina">Ver la carta</Button>);
    expect(screen.getByRole("link", { name: "Ver la carta" })).toHaveAttribute(
      "href",
      "/carta/marina",
    );
  });

  it("en carga queda deshabilitado, ocupado y no repite el envío", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Pagar
      </Button>,
    );
    const button = screen.getByRole("button", { name: /Pagar/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("exige un nombre accesible", () => {
    render(<IconButton label="Cerrar" icon={<span aria-hidden="true">×</span>} />);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("funciona como filtro activable con aria-pressed", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <Chip pressed={false} onPressedChange={onPressedChange}>
        Sin picante
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Sin picante" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.click(chip);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });
});

describe("Badge", () => {
  it("muestra texto además del color (no depende solo del color)", () => {
    render(<Badge tone="vegetariano">Vegetariano</Badge>);
    expect(screen.getByText("Vegetariano")).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("renderiza como article por defecto y acepta otra etiqueta", () => {
    const { rerender } = render(<Card>Ceviche</Card>);
    expect(screen.getByRole("article")).toHaveTextContent("Ceviche");
    rerender(
      <Card as="section" aria-label="Resumen">
        Total
      </Card>,
    );
    expect(screen.getByRole("region", { name: "Resumen" })).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("asocia la etiqueta, la ayuda y el error al campo", () => {
    render(
      <Input label="Celular" hint="9 dígitos" error="Ingresa un celular válido" name="phone" />,
    );
    const input = screen.getByLabelText("Celular");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("9 dígitos Ingresa un celular válido");
    expect(screen.getByText("Ingresa un celular válido")).toHaveAttribute("role", "alert");
  });

  it("sin error no se marca como inválido", () => {
    render(<Input label="Nombre" name="name" />);
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "false");
  });
});

describe("Select", () => {
  it("es un select nativo con etiqueta y opciones", async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Distrito"
        name="district"
        placeholder="Elige tu distrito"
        options={[
          { value: "lince", label: "Lince" },
          { value: "brena", label: "Breña" },
        ]}
      />,
    );
    const select = screen.getByLabelText("Distrito");
    await user.selectOptions(select, "brena");
    expect(select).toHaveValue("brena");
  });
});

describe("Stepper", () => {
  it("suma y resta dentro de los límites con nombres claros", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={1} min={1} max={3} onChange={onChange} itemName="Ceviche" />);

    expect(screen.getByRole("button", { name: "Quitar un Ceviche" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Agregar un Ceviche" }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByText("1")).toHaveAttribute("aria-live", "polite");
  });

  it("deshabilita sumar en el máximo", () => {
    render(<Stepper value={3} min={1} max={3} onChange={() => {}} itemName="Chicha" />);
    expect(screen.getByRole("button", { name: "Agregar un Chicha" })).toBeDisabled();
  });
});

describe("Skeleton", () => {
  it("es decorativo y no se anuncia", () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Dialog", () => {
  it("se abre con título accesible y se cierra con el botón Cerrar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Parihuelas">
        <p>Elige tu pescado</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <Dialog open onClose={onClose} title="Parihuelas">
        <p>Elige tu pescado</p>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Parihuelas" });
    expect(dialog).toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("acepta la variante drawer", () => {
    render(
      <Dialog open onClose={() => {}} title="Tu pedido" variant="drawer">
        Carrito
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Tu pedido" })).toHaveAttribute(
      "data-variant",
      "drawer",
    );
  });
});
