import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { checkNewSection, cleanSectionName, SectionPicker } from "./SectionPicker";

const SECTIONS = ["Ceviches", "Sudados", "Fuentes"];

function Harness({ initial = "", error }: { initial?: string; error?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <form>
      <SectionPicker value={value} onChange={setValue} sections={SECTIONS} error={error} />
      <output data-testid="valor">{value}</output>
    </form>
  );
}

const user = () => userEvent.setup({ delay: null });
const open = async (u: ReturnType<typeof user>) =>
  u.click(screen.getByRole("button", { name: /Sección/ }));

describe("checkNewSection", () => {
  it("limpia espacios y pone la primera letra en mayúscula", () => {
    expect(cleanSectionName("  postres   fríos ")).toBe("Postres fríos");
    expect(checkNewSection("postres", SECTIONS)).toEqual({ ok: true, name: "Postres" });
  });

  it("si ya existe (sin tildes ni mayúsculas) devuelve la existente, no una repetida", () => {
    expect(checkNewSection("CEVICHES", SECTIONS)).toEqual({ ok: true, name: "Ceviches" });
    expect(checkNewSection("sudádos", SECTIONS)).toEqual({ ok: true, name: "Sudados" });
  });

  it("rechaza nombres vacíos, de una letra o demasiado largos", () => {
    expect(checkNewSection("", SECTIONS).ok).toBe(false);
    expect(checkNewSection("a", SECTIONS).ok).toBe(false);
    expect(checkNewSection("x".repeat(41), SECTIONS).ok).toBe(false);
  });
});

describe("SectionPicker", () => {
  it("empieza cerrado y muestra la sección elegida", () => {
    render(<Harness initial="Sudados" />);
    const trigger = screen.getByRole("button", { name: /Sección/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Sudados");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("al abrir lista todas las secciones, ordenadas, con la elegida marcada", async () => {
    const u = user();
    render(<Harness initial="Sudados" />);
    await open(u);
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Ceviches", "Fuentes", "Sudados"]);
    expect(screen.getByRole("option", { name: "Sudados" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("elegir una sección la guarda y cierra la lista", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    await u.click(screen.getByRole("option", { name: "Fuentes" }));
    expect(screen.getByTestId("valor")).toHaveTextContent("Fuentes");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("crea una sección nueva y la deja elegida; después aparece en la lista", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    await u.type(screen.getByLabelText("Crear una sección nueva"), "postres");
    await u.click(screen.getByRole("button", { name: "Crear" }));
    expect(screen.getByTestId("valor")).toHaveTextContent("Postres");
    await open(u);
    expect(screen.getByRole("option", { name: "Postres" })).toBeInTheDocument();
  });

  it("Enter en el campo crea la sección sin enviar el formulario del plato", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    await u.type(screen.getByLabelText("Crear una sección nueva"), "Bebidas{Enter}");
    expect(screen.getByTestId("valor")).toHaveTextContent("Bebidas");
  });

  it("un nombre repetido elige la que ya existe y no duplica", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    await u.type(screen.getByLabelText("Crear una sección nueva"), "ceviches");
    await u.click(screen.getByRole("button", { name: "Crear" }));
    expect(screen.getByTestId("valor")).toHaveTextContent("Ceviches");
    await open(u);
    expect(screen.getAllByRole("option", { name: "Ceviches" })).toHaveLength(1);
  });

  it("avisa si el nombre nuevo es muy corto", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    await u.type(screen.getByLabelText("Crear una sección nueva"), "a");
    await u.click(screen.getByRole("button", { name: "Crear" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el nombre de la sección.");
    expect(screen.getByTestId("valor")).toHaveTextContent("");
  });

  it("se maneja con el teclado: flechas, Enter y Escape", async () => {
    const u = user();
    render(<Harness />);
    await open(u);
    expect(screen.getByRole("option", { name: "Ceviches" })).toHaveFocus();
    await u.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Fuentes" })).toHaveFocus();
    await u.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("option", { name: "Sudados" })).toHaveFocus();
    await u.keyboard("{Enter}");
    expect(screen.getByTestId("valor")).toHaveTextContent("Sudados");

    await open(u);
    await u.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sección/ })).toHaveFocus();
  });

  it("muestra el error del formulario", () => {
    render(<Harness error="Elige una sección." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Elige una sección.");
  });
});
