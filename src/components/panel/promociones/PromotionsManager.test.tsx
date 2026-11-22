import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useDemoStore } from "@/features/demo/store";

import { DemoPromotionsManager } from "./DemoPromotionsManager";

vi.mock("@/components/ui/Toaster", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
});

vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  act(() => useDemoStore.getState().reset());
});

const promoState = (title: string) =>
  useDemoStore.getState().promotions.find((p) => p.title === title);
const row = (title: string) => screen.getByRole("heading", { name: title }).closest("li")!;

async function setup() {
  const user = userEvent.setup({ delay: null });
  render(<DemoPromotionsManager />);
  await screen.findByRole("heading", { name: "Chicharrones 2×1" });
  return user;
}

describe("Promociones (modo demostración)", () => {
  it("lista las promociones con su estado, tipo y precio", async () => {
    await setup();
    expect(screen.getByText("Activas").nextElementSibling).toHaveTextContent("2");
    const ceviche = within(row("Martes de ceviche"));
    expect(ceviche.getByText("−20 %")).toBeInTheDocument();
    expect(ceviche.getByText("S/ 48.00")).toBeInTheDocument();
    expect(ceviche.getByText("S/ 38.40")).toBeInTheDocument();
    expect(within(row("Lomo saltado a S/ 39")).getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByText("Pausadas o vencidas").nextElementSibling).toHaveTextContent("1");
    expect(within(row("Chicharrones 2×1")).getByText("Destacada")).toBeInTheDocument();
  });

  it("crea una promoción de porcentaje con título sugerido", async () => {
    const user = await setup();
    await user.click(screen.getByRole("button", { name: /Nueva promoción/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva promoción", hidden: true });
    const form = within(dialog);
    await user.selectOptions(form.getByLabelText("Plato"), "Arroz con mariscos");
    await user.type(form.getByLabelText("Descuento (%)"), "15");
    expect(form.getByText("S/ 35.70")).toBeInTheDocument();
    await user.click(form.getByRole("button", { name: "Guardar promoción" }));
    expect(promoState("15 % en Arroz con mariscos")).toMatchObject({
      kind: "percent",
      percentOff: 15,
      isActive: true,
    });
  });

  it("un precio especial mayor al normal no se guarda", async () => {
    const user = await setup();
    await user.click(screen.getByRole("button", { name: /Nueva promoción/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva promoción", hidden: true });
    const form = within(dialog);
    await user.selectOptions(form.getByLabelText("Plato"), "Lomo saltado");
    await user.click(form.getByLabelText("Precio especial"));
    await user.type(form.getByLabelText(/Precio de la promoción/), "60");
    const before = useDemoStore.getState().promotions.length;
    await user.click(form.getByRole("button", { name: "Guardar promoción" }));
    expect(form.getByText(/Debe ser menor al precio normal/)).toBeInTheDocument();
    expect(useDemoStore.getState().promotions).toHaveLength(before);
  });

  it("pausa, destaca y elimina", async () => {
    const user = await setup();
    await user.click(within(row("Martes de ceviche")).getByRole("switch"));
    expect(promoState("Martes de ceviche")?.isActive).toBe(false);
    await user.click(within(row("Martes de ceviche")).getByRole("button", { name: /Destacar/ }));
    expect(promoState("Martes de ceviche")?.isFeatured).toBe(true);
    await user.click(screen.getByRole("button", { name: "Eliminar Martes de ceviche" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar promoción" }));
    expect(promoState("Martes de ceviche")).toBeUndefined();
  });

  it("crea un plato nuevo desde la promoción y vuelve con él elegido", async () => {
    const user = await setup();
    await user.click(screen.getByRole("button", { name: /Nueva promoción/ }));
    let dialog = await screen.findByRole("dialog", { name: "Nueva promoción", hidden: true });
    await user.click(within(dialog).getByRole("button", { name: /Crear plato nuevo/ }));

    const dishDialog = await screen.findByRole("dialog", { name: "Añadir plato", hidden: true });
    await user.type(within(dishDialog).getByLabelText(/Nombre/), "Ceviche de pulpo");
    await user.type(within(dishDialog).getByLabelText(/Sección/), "Ceviches");
    await user.type(within(dishDialog).getByLabelText(/Precio/), "52");
    await user.click(within(dishDialog).getByRole("button", { name: "Guardar plato" }));

    dialog = await screen.findByRole("dialog", { name: "Nueva promoción", hidden: true });
    const dish = useDemoStore.getState().dishes.find((d) => d.name === "Ceviche de pulpo");
    expect(within(dialog).getByLabelText("Plato")).toHaveValue(String(dish?.id));
    await user.click(within(dialog).getByLabelText("2×1"));
    await user.click(within(dialog).getByRole("button", { name: "Guardar promoción" }));
    expect(promoState("Ceviche de pulpo 2×1")).toMatchObject({ dishId: dish?.id });
  });
});
