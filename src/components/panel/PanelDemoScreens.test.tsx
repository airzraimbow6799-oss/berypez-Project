import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { dateKeyLima, slotStart } from "@/features/reservations/capacity";
import { useDemoStore } from "@/features/demo/store";

import { DashboardView } from "./DashboardView";
import { DemoBar } from "./DemoBar";
import { ReservationsDesk } from "./ReservationsDesk";
import { StaffManager } from "./StaffManager";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/components/ui/Toaster", () => ({ toast, Toaster: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

// Con cobertura y varios archivos a la vez, escribir en los campos tarda más de los 5 s de base.
vi.setConfig({ testTimeout: 20_000 });

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

beforeEach(() => {
  toast.success.mockClear();
  toast.error.mockClear();
  act(() => useDemoStore.getState().reset());
});

const user = () => userEvent.setup({ delay: null });

describe("Dashboard", () => {
  it("muestra las ventas de hoy, los pedidos y las reservas con los datos de ejemplo", async () => {
    render(<DashboardView />);
    expect(await screen.findByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    const { orders } = useDemoStore.getState();
    const today = orders.filter(
      (o) => o.status !== "cancelled" && dateKeyLima(o.createdAt) === dateKeyLima(Date.now()),
    );
    expect(screen.getByText("Pedidos de hoy").closest("div")).toHaveTextContent(
      String(today.length),
    );
    expect(
      screen.getByRole("heading", { name: "Ventas de los últimos 7 días" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Platos más pedidos hoy" })).toBeInTheDocument();
  });

  it("ofrece una tabla equivalente del gráfico para lectores de pantalla", async () => {
    render(<DashboardView />);
    const table = await screen.findByRole("table", { name: "Ventas por día" });
    expect(within(table).getAllByRole("row")).toHaveLength(8);
    expect(within(table).getByRole("rowheader", { name: "Hoy" })).toBeInTheDocument();
  });

  it("filtrar por sede cambia los números", async () => {
    render(<DashboardView />);
    await screen.findByRole("heading", { name: "Resumen" });
    const total = useDemoStore.getState().orders.length;
    await user().click(screen.getByRole("button", { name: "Lince" }));
    const lince = useDemoStore.getState().orders.filter((o) => o.branchName === "Lince").length;
    expect(lince).toBeLessThan(total);
    expect(screen.getByText("Pedidos de hoy").closest("div")).toBeInTheDocument();
  });

  it("un pedido nuevo suma a las ventas de hoy", async () => {
    render(<DashboardView />);
    await screen.findByRole("heading", { name: "Resumen" });
    const before = screen.getByText("Pedidos de hoy").closest("div")?.textContent;
    act(() => {
      useDemoStore.getState().simulateOrder();
    });
    expect(screen.getByText("Pedidos de hoy").closest("div")?.textContent).not.toBe(before);
  });
});

describe("Reservas con cupo", () => {
  const openDialog = async () => {
    await screen.findByRole("heading", { name: "Reservas" });
    await user().click(screen.getByRole("button", { name: /Nueva reserva/ }));
    return screen.findByRole("dialog", { name: "Nueva reserva", hidden: true });
  };

  it("muestra la ocupación de las franjas de hoy", async () => {
    render(<ReservationsDesk />);
    await screen.findByRole("heading", { name: "Reservas" });
    expect(screen.getByRole("heading", { name: /ocupación por franja/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /personas, terraza/ }).length).toBe(20);
  });

  it("guarda una reserva por llamada que cuenta como las de la web", async () => {
    render(<ReservationsDesk />);
    const dialog = await openDialog();
    // Mañana: hoy, de noche, ya pasaron todas las horas y la prueba dependía de la hora en que corre.
    const date = within(dialog).getByLabelText("Día");
    await user().clear(date);
    await user().type(date, dateKeyLima(Date.now() + 24 * 60 * 60 * 1000));
    await user().click(within(dialog).getByRole("radio", { name: "20:00" }));
    await user().type(within(dialog).getByLabelText(/Nombre/), "Camila Prueba");
    await user().type(within(dialog).getByLabelText(/Celular/), "991736402");
    await user().click(within(dialog).getByRole("button", { name: "Guardar reserva" }));

    const created = useDemoStore.getState().reservations.find((r) => r.name === "Camila Prueba");
    expect(created).toMatchObject({ source: "phone", status: "confirmed", partySize: 2 });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Reserva guardada"));
  });

  it("no guarda sin nombre ni celular válido", async () => {
    render(<ReservationsDesk />);
    const dialog = await openDialog();
    const before = useDemoStore.getState().reservations.length;
    await user().click(within(dialog).getByRole("button", { name: "Guardar reserva" }));
    expect(within(dialog).getAllByRole("alert").length).toBeGreaterThanOrEqual(2);
    expect(useDemoStore.getState().reservations).toHaveLength(before);
  });

  it("con la terraza llena a esa hora, la terraza se bloquea y queda interior o «me da igual»", async () => {
    const tomorrow = dateKeyLima(Date.now() + 24 * 60 * 60 * 1000);
    for (let i = 0; i < 2; i += 1) {
      act(() => {
        useDemoStore.getState().addReservation({
          startsAt: slotStart(tomorrow, "20:00").toISOString(),
          partySize: 2,
          area: "terraza",
          occasion: null,
          name: `Terraza ${i}`,
          phone: "999888777",
          status: "confirmed",
          branch: "Lince",
          source: "web",
        });
      });
    }
    render(<ReservationsDesk />);
    const dialog = await openDialog();
    const date = within(dialog).getByLabelText("Día");
    await user().clear(date);
    await user().type(date, tomorrow);
    await user().click(
      within(await screen.findByRole("dialog", { name: "Nueva reserva", hidden: true })).getByRole(
        "radio",
        { name: "20:00" },
      ),
    );

    const area = within(dialog).getByRole("radiogroup", { name: "Zona" });
    expect(within(area).getByRole("radio", { name: "Terraza" })).toBeDisabled();
    expect(within(area).getByRole("radio", { name: "Interior" })).toBeEnabled();
    expect(within(dialog).getByText(/La terraza está completa/)).toBeInTheDocument();
  });
});

describe("Personal", () => {
  it("lista al personal y marca quién eres", async () => {
    render(<StaffManager currentEmail="admin@demo.berypez.pe" />);
    expect(await screen.findByRole("heading", { name: "Marta Rojas" })).toBeInTheDocument();
    expect(screen.getByText("Tú")).toBeInTheDocument();
    expect(screen.getByText("Invitación pendiente")).toBeInTheDocument();
  });

  it("no deja desactivar a la única administración y avisa por qué", async () => {
    render(<StaffManager currentEmail="admin@demo.berypez.pe" />);
    await screen.findByRole("heading", { name: "Marta Rojas" });
    await user().click(screen.getByRole("switch", { name: "Marta Rojas: activo" }));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("al menos una persona de administración"),
    );
    expect(useDemoStore.getState().staff.find((m) => m.name === "Marta Rojas")?.isActive).toBe(
      true,
    );
  });

  it("desactiva a alguien de recepción sin borrarlo", async () => {
    render(<StaffManager currentEmail="admin@demo.berypez.pe" />);
    await screen.findByRole("heading", { name: "Luis Paredes" });
    await user().click(screen.getByRole("switch", { name: "Luis Paredes: activo" }));
    expect(useDemoStore.getState().staff.find((m) => m.name === "Luis Paredes")).toMatchObject({
      isActive: false,
    });
  });

  it("invita a una persona nueva y rechaza un correo repetido", async () => {
    render(<StaffManager currentEmail="admin@demo.berypez.pe" />);
    await screen.findByRole("heading", { name: "Marta Rojas" });
    await user().click(screen.getByRole("button", { name: /Invitar persona/ }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar persona", hidden: true });
    await user().type(within(dialog).getByLabelText(/Nombre/), "Nueva Persona");
    await user().type(within(dialog).getByLabelText(/Correo/), "luis@demo.berypez.pe");
    await user().selectOptions(within(dialog).getByLabelText(/Rol/), "salon");
    await user().selectOptions(within(dialog).getByLabelText(/Sede/), "Lince");
    await user().click(within(dialog).getByRole("button", { name: "Enviar invitación" }));
    expect(within(dialog).getByText("Ya hay una persona con ese correo.")).toBeInTheDocument();

    const email = within(dialog).getByLabelText(/Correo/);
    await user().clear(email);
    await user().type(email, "nueva@demo.berypez.pe");
    await user().click(within(dialog).getByRole("button", { name: "Enviar invitación" }));
    expect(useDemoStore.getState().staff.some((m) => m.email === "nueva@demo.berypez.pe")).toBe(
      true,
    );
  });
});

describe("Avisos en vivo (franja de demostración)", () => {
  it("una reserva simulada avisa con un mensaje y suma a los avisos sin leer", async () => {
    render(<DemoBar role="admin" />);
    await user().click(await screen.findByRole("button", { name: "Simular reserva" }));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Reserva nueva"));
    expect(screen.getByRole("button", { name: "Avisos, 1 sin leer" })).toBeInTheDocument();
  });

  it("recepción recibe avisos de reservas pero no de pedidos", async () => {
    render(<DemoBar role="salon" />);
    await user().click(await screen.findByRole("button", { name: "Simular pedido" }));
    expect(screen.getByRole("button", { name: "Avisos, 0 sin leer" })).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "Simular reserva" }));
    expect(screen.getByRole("button", { name: "Avisos, 1 sin leer" })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Reserva nueva"));
  });

  it("marcar todo como leído apaga el contador", async () => {
    render(<DemoBar role="admin" />);
    await user().click(await screen.findByRole("button", { name: "Simular pedido" }));
    await user().click(screen.getByRole("button", { name: /Avisos/ }));
    const drawer = await screen.findByRole("dialog", { name: "Avisos", hidden: true });
    await user().click(within(drawer).getByRole("button", { name: "Marcar como leído" }));
    expect(screen.getByRole("button", { name: "Avisos, 0 sin leer" })).toBeInTheDocument();
  });
});
