import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useDemoStore } from "@/features/demo/store";

import { DemoCartaManager as CartaManager } from "./carta/DemoCartaManager";

vi.mock("@/components/ui/Toaster", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// jsdom no implementa <dialog>.showModal() ni URL.createObjectURL: se emula lo mínimo.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
  URL.createObjectURL = vi.fn(() => "blob:foto-de-prueba");
});

// Con cobertura y varios archivos a la vez, escribir en los campos tarda más de los 5 s de base.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  act(() => useDemoStore.getState().reset());
});

const dishItem = (name: string) =>
  screen.getByRole("heading", { name }).closest("li") as HTMLElement;
const dishState = (name: string) => useDemoStore.getState().dishes.find((d) => d.name === name);
/** Recuadro de un apartado dentro del formulario, por su título. */
const groupBox = (dialog: HTMLElement, title: string) =>
  within(within(dialog).getByRole("heading", { name: title }).closest("section") as HTMLElement);

async function renderAdmin() {
  const user = userEvent.setup({ delay: null });
  render(<CartaManager role="admin" />);
  await screen.findByRole("heading", { name: "Ceviche Berypez" });
  return user;
}

async function openNewDish(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Añadir plato/ }));
  return screen.findByRole("dialog", { name: "Añadir plato", hidden: true });
}

describe("CartaManager · lista", () => {
  it("muestra los platos reales con su foto y el resumen sin stock", async () => {
    await renderAdmin();
    expect(screen.getByText("Agotados").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Con apartados")).toBeInTheDocument();
    expect(screen.queryByText(/stock/i)).not.toBeInTheDocument();
    expect(within(dishItem("Ceviche Berypez")).getByText(/Marina — Ceviches/)).toBeInTheDocument();
  });

  it("cambia el precio al salir del campo y lo guarda en céntimos", async () => {
    const user = await renderAdmin();
    const price = within(dishItem("Ceviche Berypez")).getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "50.50");
    await user.tab();
    expect(dishState("Ceviche Berypez")?.priceCents).toBe(5050);
  });

  it("un precio inválido muestra el error y no cambia nada", async () => {
    const user = await renderAdmin();
    const row = within(dishItem("Ceviche Berypez"));
    const price = row.getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "abc");
    await user.tab();
    expect(row.getByRole("alert")).toHaveTextContent("Escribe un precio");
    expect(dishState("Ceviche Berypez")?.priceCents).toBe(4800);
  });

  it("un cambio de más de 40 % pide confirmación antes de guardarse", async () => {
    const user = await renderAdmin();
    const price = within(dishItem("Ceviche Berypez")).getByLabelText("Precio (S/)");
    await user.clear(price);
    await user.type(price, "90");
    await user.tab();
    expect(dishState("Ceviche Berypez")?.priceCents).toBe(4800);
    expect(await screen.findByText(/pasaría de S\/ 48.00 a S\/ 90.00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, cambiar el precio" }));
    expect(dishState("Ceviche Berypez")?.priceCents).toBe(9000);
  });

  it("un plato con apartado con precio muestra «Desde» y se edita desde su formulario", async () => {
    await renderAdmin();
    const row = within(dishItem("Chicharrones"));
    expect(row.getByText(/Desde\s*S\/ 40.00/)).toBeInTheDocument();
    expect(row.queryByLabelText("Precio (S/)")).not.toBeInTheDocument();
  });

  it("el interruptor marca un plato como agotado y lo vuelve a habilitar", async () => {
    const user = await renderAdmin();
    const toggle = within(dishItem("Ceviche Berypez")).getByRole("switch");
    await user.click(toggle);
    expect(dishState("Ceviche Berypez")?.isAvailable).toBe(false);
    await user.click(toggle);
    expect(dishState("Ceviche Berypez")?.isAvailable).toBe(true);
  });

  it("elimina un plato después de confirmar", async () => {
    const user = await renderAdmin();
    await user.click(screen.getByRole("button", { name: "Eliminar Leche de tigre 12 oz" }));
    expect(dishState("Leche de tigre 12 oz")).toBeDefined();
    await user.click(await screen.findByRole("button", { name: "Eliminar plato" }));
    expect(dishState("Leche de tigre 12 oz")).toBeUndefined();
  });

  it("busca también por las opciones de los apartados y filtra por carta y agotados", async () => {
    const user = await renderAdmin();
    await user.type(screen.getByLabelText("Buscar plato"), "calamar");
    expect(screen.getByRole("heading", { name: "Chicharrones" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ceviche Berypez" })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar plato"));
    await user.click(screen.getByRole("button", { name: "Criolla" }));
    expect(screen.getByRole("heading", { name: "Lomo saltado" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ceviche Berypez" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todas las cartas" }));
    await user.click(screen.getByRole("button", { name: "Solo agotados" }));
    expect(screen.getByRole("heading", { name: "Parihuelas" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lomo saltado" })).not.toBeInTheDocument();
  });

  it("sin resultados muestra un mensaje claro", async () => {
    const user = await renderAdmin();
    await user.type(screen.getByLabelText("Buscar plato"), "xyz");
    expect(screen.getByText("No hay platos con ese filtro")).toBeInTheDocument();
  });
});

describe("CartaManager · añadir y editar platos", () => {
  it("añade un plato simple con foto, carta, sección y etiquetas", async () => {
    const user = await renderAdmin();
    const dialog = await openNewDish(user);
    const form = within(dialog);

    await user.upload(
      form.getByLabelText("Subir foto"),
      new File(["x"], "tiradito.webp", { type: "image/webp" }),
    );
    await user.type(form.getByLabelText(/Nombre/), "Tiradito nikkei");
    await user.type(form.getByLabelText("Descripción"), "Pescado en láminas con salsa nikkei.");
    await user.click(form.getByRole("button", { name: "Piqueos" }));
    await user.type(form.getByLabelText(/Sección/), "Tiraditos");
    await user.type(form.getByLabelText(/Precio/), "34.5");
    await user.click(form.getByRole("button", { name: "Nuevo" }));
    await user.click(form.getByRole("button", { name: "Guardar plato" }));

    expect(dishState("Tiradito nikkei")).toMatchObject({
      priceCents: 3450,
      menus: ["marina", "piqueos"],
      section: "Tiraditos",
      tags: ["nuevo"],
      image: { url: "blob:foto-de-prueba", alt: "Tiradito nikkei" },
      priceGroup: null,
      choiceGroups: [],
    });
    expect(screen.getByRole("heading", { name: "Tiradito nikkei" })).toBeInTheDocument();
  });

  it("rechaza una foto que no es imagen", async () => {
    const user = userEvent.setup({ delay: null, applyAccept: false });
    render(<CartaManager role="admin" />);
    await screen.findByRole("heading", { name: "Ceviche Berypez" });
    const dialog = await openNewDish(user);
    await user.upload(
      within(dialog).getByLabelText("Subir foto"),
      new File(["x"], "carta.pdf", { type: "application/pdf" }),
    );
    expect(within(dialog).getByText("La foto debe ser JPG, PNG o WEBP.")).toBeInTheDocument();
  });

  it("añade un plato con apartado con precio y otro sin precio", async () => {
    const user = await renderAdmin();
    const dialog = await openNewDish(user);
    const form = within(dialog);
    await user.type(form.getByLabelText(/Nombre/), "Tacu tacu");
    await user.type(form.getByLabelText(/Sección/), "Fondos");

    await user.click(form.getByRole("button", { name: /Agregar apartado con precio/ }));
    expect(form.queryByLabelText(/^Precio \(S\/\) \(obligatorio\)/)).not.toBeInTheDocument();
    const prices = groupBox(dialog, "Apartado con precio");
    await user.type(prices.getByLabelText("Título del apartado"), "Elige tu acompañante");
    await user.type(prices.getByLabelText("Opción 1"), "Con lomo");
    await user.type(prices.getAllByLabelText("Precio (S/)")[0]!, "52");
    await user.type(prices.getByLabelText("Opción 2"), "Con mariscos");
    await user.type(prices.getAllByLabelText("Precio (S/)")[1]!, "48");

    await user.click(form.getByRole("button", { name: /Agregar apartado sin precio/ }));
    const choices = groupBox(dialog, "Apartado sin precio");
    await user.type(choices.getByLabelText("Título del apartado"), "Término");
    await user.type(choices.getByLabelText("Opción 1"), "Jugoso");
    await user.type(choices.getByLabelText("Opción 2"), "Bien cocido");

    await user.click(form.getByRole("button", { name: "Guardar plato" }));
    expect(dishState("Tacu tacu")).toMatchObject({
      priceCents: 4800,
      priceGroup: {
        label: "Elige tu acompañante",
        options: [
          { label: "Con lomo", priceCents: 5200 },
          { label: "Con mariscos", priceCents: 4800 },
        ],
      },
      choiceGroups: [{ label: "Término", options: ["Jugoso", "Bien cocido"] }],
    });
  });

  it("no deja guardar sin nombre, sección ni precio, ni apartados incompletos", async () => {
    const user = await renderAdmin();
    const before = useDemoStore.getState().dishes.length;
    const dialog = await openNewDish(user);
    const form = within(dialog);
    await user.click(form.getByRole("button", { name: /Agregar apartado sin precio/ }));
    await user.click(form.getByRole("button", { name: "Guardar plato" }));

    expect(form.getAllByRole("alert").length).toBeGreaterThanOrEqual(5);
    expect(form.getByRole("status")).toHaveTextContent(/Revisa los \d+ campos marcados/);
    expect(useDemoStore.getState().dishes).toHaveLength(before);
  });

  it("edita un plato con sus apartados: cambia una opción, agrega otra y guarda", async () => {
    const user = await renderAdmin();
    await user.click(screen.getByRole("button", { name: "Editar Sudados" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar «Sudados»", hidden: true });
    const prices = groupBox(dialog, "Apartado con precio");
    expect(prices.getByLabelText("Título del apartado")).toHaveValue("Elige tu pescado");

    const chita = prices.getAllByLabelText("Precio (S/)")[3]!;
    await user.clear(chita);
    await user.type(chita, "70");
    await user.click(prices.getByRole("button", { name: "Agregar opción" }));
    await user.type(prices.getByLabelText("Opción 5"), "Corvina");
    await user.type(prices.getAllByLabelText("Precio (S/)")[4]!, "75");

    const choices = groupBox(dialog, "Apartado sin precio");
    await user.clear(choices.getByLabelText("Opción 2"));
    await user.type(choices.getByLabelText("Opción 2"), "Pescado entero 600 GR");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    const sudados = dishState("Sudados");
    expect(sudados?.priceGroup?.options.slice(3)).toEqual([
      { label: "Chita", priceCents: 7000 },
      { label: "Corvina", priceCents: 7500 },
    ]);
    expect(sudados?.choiceGroups[0]?.options[1]).toBe("Pescado entero 600 GR");
    expect(sudados?.priceCents).toBe(4000);
  });

  it("quitar el apartado con precio vuelve a pedir el precio normal", async () => {
    const user = await renderAdmin();
    await user.click(screen.getByRole("button", { name: "Editar Pisco Sour" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar «Pisco Sour»", hidden: true });
    await user.click(within(dialog).getByRole("button", { name: "Quitar apartado con precio" }));
    await user.type(within(dialog).getByLabelText(/^Precio/), "27");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(dishState("Pisco Sour")).toMatchObject({ priceGroup: null, priceCents: 2700 });
  });
});
