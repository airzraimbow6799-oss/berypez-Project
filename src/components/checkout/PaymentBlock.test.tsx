import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { validateCard } from "@/features/payments/card";
import type { PaymentMethodId } from "@/features/payments/simulate";

import { EMPTY_PAY_DATA, PaymentBlock, type PayData } from "./PaymentBlock";

function Harness({
  initial = "cash",
  errors = {},
}: {
  initial?: PaymentMethodId;
  errors?: Record<string, string>;
}) {
  const [method, setMethod] = useState<PaymentMethodId>(initial);
  const [data, setData] = useState<PayData>(EMPTY_PAY_DATA);
  return (
    <PaymentBlock
      method={method}
      onMethodChange={setMethod}
      data={data}
      onDataChange={(patch) => setData((c) => ({ ...c, ...patch }))}
      errors={errors}
      isBusy={false}
      cashField={<p>CAMPO-EFECTIVO</p>}
    />
  );
}

// Con cobertura y varios archivos a la vez, escribir en los campos tarda más de los 5 s de base.
vi.setConfig({ testTimeout: 20_000 });

const user = () => userEvent.setup({ delay: null });

describe("PaymentBlock", () => {
  it("avisa que es una simulación y ofrece los cuatro medios, con efectivo elegido", () => {
    render(<Harness />);
    expect(screen.getByText(/Simulación para la demostración/)).toBeInTheDocument();
    for (const nombre of [/Efectivo/, /Yape/, /Plin/, /Tarjeta/]) {
      expect(screen.getByRole("radio", { name: nombre })).toBeEnabled();
    }
    expect(screen.getByRole("radio", { name: /Efectivo/ })).toBeChecked();
    expect(screen.getByText("CAMPO-EFECTIVO")).toBeInTheDocument();
  });

  it("con efectivo no pide datos de pago ni muestra los de prueba", () => {
    render(<Harness />);
    expect(screen.queryByLabelText("Número de tarjeta")).not.toBeInTheDocument();
    expect(screen.queryByText(/Para probar/)).not.toBeInTheDocument();
  });

  it("al elegir tarjeta aparece el formulario y la tarjeta se arma al escribir", async () => {
    const u = user();
    render(<Harness />);
    await u.click(screen.getByRole("radio", { name: /Tarjeta/ }));

    const number = screen.getByLabelText("Número de tarjeta");
    await u.type(number, "4111111111111111");
    expect(number).toHaveValue("4111 1111 1111 1111");
    expect(screen.getByText("Detectamos Visa.")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Vista previa de la tarjeta Visa/ }),
    ).toBeInTheDocument();
    const preview = screen.getByRole("img", { name: /Vista previa de la tarjeta/ });
    expect(within(preview).getByText("4111 1111 1111 1111")).toBeInTheDocument();

    await u.type(screen.getByLabelText("Nombre en la tarjeta"), "Rocío Alarcón");
    expect(within(preview).getByText("Rocío Alarcón")).toBeInTheDocument();

    await u.type(screen.getByLabelText("Vence"), "1228");
    expect(screen.getByLabelText("Vence")).toHaveValue("12/28");
  });

  it("al entrar al código de seguridad la tarjeta se da vuelta", async () => {
    const u = user();
    render(<Harness initial="card" />);
    expect(screen.getByRole("img", { name: /Vista previa/ })).not.toHaveAccessibleName(
      /lado del código/,
    );
    await u.click(screen.getByLabelText("Código (CVV)"));
    expect(screen.getByRole("img", { name: /lado del código de seguridad/ })).toBeInTheDocument();
    await u.tab();
    expect(screen.getByRole("img", { name: /Vista previa/ })).not.toHaveAccessibleName(
      /lado del código/,
    );
  });

  it("Amex pide un código de 4 dígitos", async () => {
    const u = user();
    render(<Harness initial="card" />);
    await u.type(screen.getByLabelText("Número de tarjeta"), "378282246310005");
    expect(screen.getByLabelText("Número de tarjeta")).toHaveValue("3782 822463 10005");
    const cvv = screen.getByLabelText("Código (CVV)");
    await u.type(cvv, "123456");
    expect(cvv).toHaveValue("1234");
  });

  it("muestra los errores que le pasan, junto a cada campo", () => {
    const errors = validateCard({ number: "4111", name: "", expiry: "", cvv: "" });
    render(<Harness initial="card" errors={errors} />);
    expect(screen.getAllByRole("alert")).toHaveLength(4);
    expect(screen.getByLabelText("Número de tarjeta")).toHaveAttribute("aria-invalid", "true");
  });

  it("Yape pide celular y código de aprobación, y solo deja escribir números", async () => {
    const u = user();
    render(<Harness />);
    await u.click(screen.getByRole("radio", { name: /Yape/ }));
    await u.type(screen.getByLabelText("Celular de Yape"), "9a1b2345678");
    expect(screen.getByLabelText("Celular de Yape")).toHaveValue("912345678");
    await u.type(screen.getByLabelText("Código de aprobación"), "48 29 13 77");
    expect(screen.getByLabelText("Código de aprobación")).toHaveValue("482913");
    expect(screen.getByText(/Código de aprobación/, { selector: "em" })).toBeInTheDocument();
  });

  it("Plin pide solo el celular y explica la solicitud a la app", async () => {
    const u = user();
    render(<Harness />);
    await u.click(screen.getByRole("radio", { name: /Plin/ }));
    expect(screen.getByLabelText("Celular afiliado a Plin")).toBeInTheDocument();
    expect(screen.getByText(/solicitud a tu app/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Número de tarjeta")).not.toBeInTheDocument();
  });

  it("dice dónde van los datos de la tarjeta (nunca a nuestro servidor)", () => {
    render(<Harness initial="card" />);
    expect(screen.getByText(/La web nunca los guarda/)).toBeInTheDocument();
  });

  it("la tarjeta de prueba aprobada y la rechazada están a la vista", () => {
    render(<Harness initial="card" />);
    expect(screen.getByText("4111 1111 1111 1111", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("4000 0000 0000 0002", { selector: "span" })).toBeInTheDocument();
  });
});
