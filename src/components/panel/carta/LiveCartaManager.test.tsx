import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { seedDishes } from "@/features/demo/seed";

import { LiveCartaManager } from "./LiveCartaManager";

const actions = vi.hoisted(() => ({
  saveDish: vi.fn(),
  setDishAvailable: vi.fn(),
  setDishPrice: vi.fn(),
  removeDish: vi.fn(),
  uploadDishPhoto: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@/app/panel/(protegido)/carta/actions", () => actions);
vi.mock("@/features/carta/compress-photo", () => ({
  compressPhoto: vi.fn(async () => new File(["x"], "foto.webp", { type: "image/webp" })),
}));
vi.mock("@/components/ui/Toaster", () => ({ toast, Toaster: () => null }));

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

const dishes = seedDishes();
const row = (name: string) => screen.getByRole("heading", { name }).closest("li") as HTMLElement;

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("LiveCartaManager", () => {
  it("avisa que los cambios llegan a la web", () => {
    render(<LiveCartaManager role="admin" initialDishes={dishes} />);
    expect(screen.getByText(/Los cambios se ven en la web al guardar/)).toBeInTheDocument();
  });

  it("marca agotado al instante y lo revierte si el servidor falla", async () => {
    const user = userEvent.setup({ delay: null });
    actions.setDishAvailable.mockResolvedValue({ ok: false, message: "Sin conexión" });
    render(<LiveCartaManager role="admin" initialDishes={dishes} />);
    const toggle = within(row("Ceviche Berypez")).getByRole("switch");
    await user.click(toggle);
    expect(actions.setDishAvailable).toHaveBeenCalledWith(1, false);
    expect(toast.error).toHaveBeenCalledWith("Sin conexión");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("guarda una edición en el servidor y muestra la carta que devuelve", async () => {
    const user = userEvent.setup({ delay: null });
    const renamed = dishes.map((d) => (d.id === 1 ? { ...d, name: "Ceviche de la casa" } : d));
    actions.saveDish.mockResolvedValue({ ok: true, dishes: renamed });
    render(<LiveCartaManager role="admin" initialDishes={dishes} />);
    await user.click(screen.getByRole("button", { name: "Editar Ceviche Berypez" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Editar «Ceviche Berypez»",
      hidden: true,
    });
    const name = within(dialog).getByLabelText(/Nombre/);
    await user.clear(name);
    await user.type(name, "Ceviche de la casa");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(actions.saveDish).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: "Ceviche de la casa" }),
    );
    expect(await screen.findByRole("heading", { name: "Ceviche de la casa" })).toBeInTheDocument();
  });

  it("si el servidor rechaza el plato, el formulario queda abierto con el motivo", async () => {
    const user = userEvent.setup({ delay: null });
    actions.saveDish.mockResolvedValue({ ok: false, message: "Solo Administración puede…" });
    render(<LiveCartaManager role="admin" initialDishes={dishes} />);
    await user.click(screen.getByRole("button", { name: "Editar Ceviche Berypez" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Editar «Ceviche Berypez»",
      hidden: true,
    });
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByRole("status")).toHaveTextContent(
      "Solo Administración puede…",
    );
  });

  it("achica y sube la foto al almacenamiento", async () => {
    const user = userEvent.setup({ delay: null });
    actions.uploadDishPhoto.mockResolvedValue({
      ok: true,
      url: "https://abc.supabase.co/storage/v1/object/public/catalog/products/panel/x.webp",
    });
    render(<LiveCartaManager role="admin" initialDishes={dishes} />);
    await user.click(screen.getByRole("button", { name: /Añadir plato/ }));
    const dialog = await screen.findByRole("dialog", { name: "Añadir plato", hidden: true });
    await user.upload(
      within(dialog).getByLabelText("Subir foto"),
      new File(["x"], "foto.jpg", { type: "image/jpeg" }),
    );
    expect(actions.uploadDishPhoto).toHaveBeenCalledTimes(1);
    const sent = actions.uploadDishPhoto.mock.calls[0]?.[0] as FormData;
    expect((sent.get("photo") as File).type).toBe("image/webp");
    expect(await within(dialog).findByText("Cambiar foto")).toBeInTheDocument();
  });
});
