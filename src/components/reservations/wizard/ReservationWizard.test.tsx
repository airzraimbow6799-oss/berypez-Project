import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReservationWizard } from "./ReservationWizard";

// Flujos completos con escritura simulada: con cobertura y carga del CI superan los 5 s por defecto.
vi.setConfig({ testTimeout: 20_000 });

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("sede=jesus-maria"),
}));
vi.mock("@/components/forms/TurnstileWidget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string) => void }) => (
    <button type="button" onClick={() => onToken("token-ok")}>
      No soy un robot
    </button>
  ),
}));

const SLOTS = {
  success: true,
  data: {
    slots: [
      { time: "12:00", available: false },
      { time: "13:00", available: true },
      { time: "16:00", available: true },
    ],
  },
};

function mockFetch(postResponse: { status: number; body: unknown }) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.startsWith("/api/reservations/availability")) {
      return new Response(JSON.stringify(SLOTS));
    }
    if (url === "/api/reservations" && init?.method === "POST") {
      return new Response(JSON.stringify(postResponse.body), { status: postResponse.status });
    }
    throw new Error(`fetch inesperado: ${url}`);
  });
}

async function goToDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Siguiente: Día y hora/ }));
  await user.click(screen.getByRole("button", { name: "viernes 20 de noviembre" }));
  await user.click(await screen.findByRole("radio", { name: /1:00 p\. m\./ }));
  await user.click(screen.getByRole("button", { name: /Siguiente: Tus datos/ }));
}

describe("ReservationWizard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T09:00:00-05:00"));
    push.mockReset();
    // jsdom no implementa scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("guía los 4 pasos y crea la reserva con los datos elegidos", async () => {
    const fetchSpy = mockFetch({
      status: 201,
      body: { success: true, data: { manageToken: "abc123", reservationId: 7 } },
    });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    expect(screen.getByRole("heading", { name: "¿En qué sede te esperamos?" })).toBeInTheDocument();
    expect(document.title).toBe("Reservar · Sede | Berypez");
    expect(screen.getByRole("radio", { name: /Jesús María/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Una persona más" }));
    expect(screen.getByRole("group", { name: "¿Cuántas personas vienen?" })).toHaveTextContent(
      "3 personas",
    );

    await goToDetails(user);
    expect(document.title).toBe("Reservar · Tus datos | Berypez");

    await user.type(screen.getByLabelText(/Nombre y apellido/), "Rosa Quispe");
    await user.type(screen.getByLabelText(/^Celular/), "987 654 321");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Siguiente: Confirmar/ }));

    const summary = screen.getByRole("heading", { name: "Revisa y confirma tu reserva" });
    expect(summary).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cambiar día y hora" }).parentElement?.parentElement,
    ).toHaveTextContent("viernes 20 de noviembre, a las 1:00 p. m.");

    await user.click(screen.getByRole("button", { name: "No soy un robot" }));
    await user.click(screen.getByRole("button", { name: "Confirmar reserva" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/reservas/abc123"));
    const post = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      branchSlug: "jesus-maria",
      partySize: 3,
      date: "2026-11-20",
      time: "13:00",
      name: "Rosa Quispe",
      phone: "987654321",
    });
  });

  it("no deja avanzar sin hora y lo explica", async () => {
    mockFetch({ status: 500, body: {} });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    await user.click(screen.getByRole("button", { name: /Siguiente: Día y hora/ }));
    await user.click(screen.getByRole("button", { name: /Siguiente: Tus datos/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("Elige un día y una hora.");
    expect(screen.getByRole("heading", { name: "¿Qué día y a qué hora?" })).toBeInTheDocument();
  });

  it("muestra los horarios llenos como «Lleno» y no se pueden elegir", async () => {
    mockFetch({ status: 500, body: {} });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    await user.click(screen.getByRole("button", { name: /Siguiente: Día y hora/ }));
    await user.click(screen.getByRole("button", { name: "viernes 20 de noviembre" }));

    const full = await screen.findByRole("radio", { name: /12:00 p\. m\./ });
    expect(full).toBeDisabled();
    expect(within(full.closest("label") as HTMLElement).getByText("Lleno")).toBeInTheDocument();
  });

  it("si la hora se llenó mientras confirmaba, vuelve al paso 2 con un aviso claro", async () => {
    mockFetch({
      status: 409,
      body: { success: false, error: { code: "SLOT_FULL", message: "Lleno" } },
    });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    await goToDetails(user);
    await user.type(screen.getByLabelText(/Nombre y apellido/), "Rosa Quispe");
    await user.type(screen.getByLabelText(/^Celular/), "987654321");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Siguiente: Confirmar/ }));
    await user.click(screen.getByRole("button", { name: "No soy un robot" }));
    await user.click(screen.getByRole("button", { name: "Confirmar reserva" }));

    expect(
      await screen.findByText("Esa hora se acaba de llenar. Elige otra, por favor."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "¿Qué día y a qué hora?" })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("descarta el token antibots usado: al volver a confirmar pide uno nuevo", async () => {
    const fetchSpy = mockFetch({
      status: 409,
      body: { success: false, error: { code: "SLOT_FULL", message: "Lleno" } },
    });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    await goToDetails(user);
    await user.type(screen.getByLabelText(/Nombre y apellido/), "Rosa Quispe");
    await user.type(screen.getByLabelText(/^Celular/), "987654321");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Siguiente: Confirmar/ }));
    await user.click(screen.getByRole("button", { name: "No soy un robot" }));
    await user.click(screen.getByRole("button", { name: "Confirmar reserva" }));
    await screen.findByText("Esa hora se acaba de llenar. Elige otra, por favor.");

    // Elige otra hora y vuelve directo al resumen SIN un token nuevo.
    await user.click(screen.getByRole("radio", { name: /4:00 p\. m\./ }));
    await user.click(screen.getByRole("button", { name: "Volver al resumen" }));
    await user.click(screen.getByRole("button", { name: "Confirmar reserva" }));

    expect(await screen.findByText("Confirma que no eres un robot.")).toBeInTheDocument();
    const posts = fetchSpy.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(posts).toHaveLength(1);
  });

  it("valida los datos del paso 3 antes de avanzar", async () => {
    mockFetch({ status: 500, body: {} });
    const user = userEvent.setup();
    render(<ReservationWizard />);

    await goToDetails(user);
    await user.click(screen.getByRole("button", { name: /Siguiente: Confirmar/ }));

    expect(screen.getByText("Escribe tu nombre.")).toBeInTheDocument();
    expect(screen.getByText(/Acepta la política de privacidad/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "¿A nombre de quién reservamos?" }),
    ).toBeInTheDocument();
  });
});

describe("ReservationWizard · Cambiar desde el resumen", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T09:00:00-05:00"));
    Element.prototype.scrollIntoView = vi.fn();
    mockFetch({ status: 500, body: {} });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function goToSummary(user: ReturnType<typeof userEvent.setup>) {
    await goToDetails(user);
    await user.type(screen.getByLabelText(/Nombre y apellido/), "Rosa Quispe");
    await user.type(screen.getByLabelText(/^Celular/), "987654321");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Siguiente: Confirmar/ }));
    expect(screen.getByRole("heading", { name: "Revisa y confirma tu reserva" })).toBeVisible();
  }

  it("cambiar el nombre vuelve directo al resumen", async () => {
    const user = userEvent.setup();
    render(<ReservationWizard />);
    await goToSummary(user);

    await user.click(screen.getByRole("button", { name: "Cambiar a nombre de" }));
    expect(screen.getByRole("status")).toHaveTextContent("Al terminar, vuelves al resumen.");
    const name = screen.getByLabelText(/Nombre y apellido/);
    await user.clear(name);
    await user.type(name, "Julio Pérez");
    await user.click(screen.getByRole("button", { name: "Volver al resumen" }));

    expect(screen.getByRole("heading", { name: "Revisa y confirma tu reserva" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Cambiar a nombre de" }).parentElement?.parentElement,
    ).toHaveTextContent("Julio Pérez");
  });

  it("cambiar las personas pide elegir la hora otra vez y luego vuelve al resumen", async () => {
    const user = userEvent.setup();
    render(<ReservationWizard />);
    await goToSummary(user);

    await user.click(screen.getByRole("button", { name: "Cambiar personas" }));
    await user.click(screen.getByRole("button", { name: "Una persona más" }));
    // La hora depende del número de personas: hay que volver a elegirla.
    await user.click(screen.getByRole("button", { name: /Siguiente: Día y hora/ }));
    await user.click(await screen.findByRole("radio", { name: /4:00 p\. m\./ }));
    await user.click(screen.getByRole("button", { name: "Volver al resumen" }));

    expect(screen.getByRole("heading", { name: "Revisa y confirma tu reserva" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Cambiar personas" }).parentElement?.parentElement,
    ).toHaveTextContent("3 personas");
  });

  it("«Deshacer cambios» restaura lo que había y vuelve al resumen", async () => {
    const user = userEvent.setup();
    render(<ReservationWizard />);
    await goToSummary(user);

    await user.click(screen.getByRole("button", { name: "Cambiar sede" }));
    await user.click(screen.getByRole("radio", { name: /Lince/ }));
    await user.click(screen.getByRole("button", { name: "Deshacer cambios" }));

    expect(screen.getByRole("heading", { name: "Revisa y confirma tu reserva" })).toBeVisible();
    const sede = screen.getByRole("button", { name: "Cambiar sede" }).parentElement?.parentElement;
    expect(sede).toHaveTextContent("Jesús María");
    expect(
      screen.getByRole("button", { name: "Cambiar día y hora" }).parentElement?.parentElement,
    ).toHaveTextContent("1:00 p. m.");
  });
});
