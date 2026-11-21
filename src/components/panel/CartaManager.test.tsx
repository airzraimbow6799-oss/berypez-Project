import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useDemoStore } from "@/features/demo/store";

import { CartaManager } from "./CartaManager";

vi.mock("@/components/ui/Toaster", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

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

// Con cobertura y varios archivos a la vez, escribir en los campos tarda más de los 5 s de base.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  act(() => useDemoStore.getState().reset());
});

const dishItem = (name: string) =>
  screen.getByRole("heading", { name }).closest("li") as HTMLElement;
const dishState = (name: string) => useDemoStore.getState().dishes.find((d) => d.name === name);

describe("CartaManager · administración", () => {
  it("lista los platos de ejemplo con el resumen de agotados", async () => {
    render(<CartaManager role="admin" />);
    expect(await screen.findByRole("heading", { name: "Ceviche clásico" })).toBeInTheDocument();
    expect(screen.getByText("Agotados").nextElementSibling).toHaveTextContent("2");
  });

  it("cambia el precio al salir del campo y lo guarda en céntimos", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const price = within(dishItem("Ceviche clásico")).getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "40.50");
    await user.tab();
    expect(dishState("Ceviche clásico")?.priceCents).toBe(4050);
  });

  it("un precio inválido muestra el error y no cambia nada", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const row = within(dishItem("Ceviche clásico"));
    const price = row.getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "abc");
    await user.tab();
    expect(row.getByRole("alert")).toHaveTextContent("Escribe un precio");
    expect(dishState("Ceviche clásico")?.priceCents).toBe(3800);
  });

  it("un cambio de más de 40 % pide confirmación antes de guardarse", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const price = within(dishItem("Ceviche clásico")).getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "90");
    await user.tab();
    expect(dishState("Ceviche clásico")?.priceCents).toBe(3800);
    expect(await screen.findByText(/pasaría de S\/ 38.00 a S\/ 90.00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, cambiar el precio" }));
    expect(dishState("Ceviche clásico")?.priceCents).toBe(9000);
  });

  it("el interruptor marca un plato como agotado", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const toggle = within(dishItem("Ceviche clásico")).getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);
    expect(dishState("Ceviche clásico")?.isAvailable).toBe(false);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("stock en 0 deja el plato agotado y bloquea el interruptor hasta reponer", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const row = within(dishItem("Parihuelas"));
    const stock = row.getByLabelText("Stock");
    await user.clear(stock);
    await user.type(stock, "0");
    await user.tab();
    expect(dishState("Parihuelas")).toMatchObject({ stockQty: 0, isAvailable: false });
    expect(row.getByRole("switch")).toBeDisabled();

    await user.clear(stock);
    await user.type(stock, "6");
    await user.tab();
    expect(dishState("Parihuelas")).toMatchObject({ stockQty: 6, isAvailable: true });
  });

  it("añade un plato nuevo con el formulario", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    await user.click(screen.getByRole("button", { name: /Añadir plato/ }));
    const dialog = await screen.findByRole("dialog", { name: "Añadir plato", hidden: true });
    await user.type(within(dialog).getByLabelText(/Nombre/), "Tiradito nikkei");
    await user.selectOptions(within(dialog).getByLabelText(/Categoría/), "Entradas");
    await user.type(within(dialog).getByLabelText(/Precio/), "34.5");
    await user.click(within(dialog).getByRole("button", { name: "Guardar plato" }));
    expect(dishState("Tiradito nikkei")).toMatchObject({ priceCents: 3450, category: "Entradas" });
  });

  it("el formulario no deja guardar sin nombre ni precio", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const before = useDemoStore.getState().dishes.length;
    await user.click(screen.getByRole("button", { name: /Añadir plato/ }));
    const dialog = await screen.findByRole("dialog", { name: "Añadir plato", hidden: true });
    await user.click(within(dialog).getByRole("button", { name: "Guardar plato" }));
    expect(within(dialog).getAllByRole("alert").length).toBeGreaterThanOrEqual(2);
    expect(useDemoStore.getState().dishes).toHaveLength(before);
  });

  it("elimina un plato después de confirmar", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    await user.click(screen.getByRole("button", { name: "Eliminar Leche de tigre" }));
    expect(dishState("Leche de tigre")).toBeDefined();
    await user.click(await screen.findByRole("button", { name: "Eliminar plato" }));
    expect(dishState("Leche de tigre")).toBeUndefined();
  });

  it("filtra por texto y por «solo agotados»", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    await user.type(screen.getByLabelText("Buscar plato"), "jalea");
    expect(screen.getByRole("heading", { name: "Jalea mixta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ceviche clásico" })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar plato"));
    await user.click(screen.getByRole("button", { name: "Solo agotados" }));
    expect(screen.queryByRole("heading", { name: "Ceviche clásico" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiradito al ají amarillo" })).toBeInTheDocument();
  });

  it("sin resultados muestra un mensaje claro", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    await user.type(screen.getByLabelText("Buscar plato"), "xyz");
    expect(screen.getByText("No hay platos con ese filtro")).toBeInTheDocument();
  });
});

describe("CartaManager · cocina", () => {
  it("puede marcar agotados y ajustar stock, pero no cambiar precios, añadir ni eliminar", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CartaManager role="cocina" />);
    await screen.findByRole("heading", { name: "Ceviche clásico" });
    const row = within(dishItem("Ceviche clásico"));
    expect(row.queryByLabelText("Precio (S/)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Añadir plato/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Eliminar / })).not.toBeInTheDocument();

    await user.click(row.getByRole("switch"));
    expect(dishState("Ceviche clásico")?.isAvailable).toBe(false);
  });
});
