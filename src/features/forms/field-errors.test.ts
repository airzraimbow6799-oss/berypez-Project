import { describe, expect, it } from "vitest";

import { clearFieldError, fieldError } from "./field-errors";

const CELULAR_INVALIDO = "Ingresa un celular de 9 dígitos que empiece con 9.";

describe("fieldError", () => {
  it("QA-005: un error del servidor vacío no tapa el error del propio campo", () => {
    const server = { phone: "" };
    const client = { phone: CELULAR_INVALIDO };
    expect(fieldError(server, client, { phone: true }, "phone")).toBe(CELULAR_INVALIDO);
  });

  it("el error del servidor tiene prioridad cuando trae texto", () => {
    const server = { phone: "Ese celular está bloqueado." };
    const client = { phone: CELULAR_INVALIDO };
    expect(fieldError(server, client, { phone: true }, "phone")).toBe(
      "Ese celular está bloqueado.",
    );
  });

  it("no muestra el error local hasta que la persona pasa por el campo", () => {
    expect(fieldError({}, { phone: CELULAR_INVALIDO }, {}, "phone")).toBeUndefined();
    expect(fieldError({}, { phone: CELULAR_INVALIDO }, { phone: true }, "phone")).toBe(
      CELULAR_INVALIDO,
    );
  });

  it("sin errores devuelve undefined (nunca un texto vacío)", () => {
    expect(fieldError({ name: "" }, { name: "" }, { name: true }, "name")).toBeUndefined();
  });
});

describe("clearFieldError", () => {
  it("quita solo ese campo y no muta el original", () => {
    const original = { phone: "x", name: "y" };
    const result = clearFieldError(original, "phone");
    expect(result).toEqual({ name: "y" });
    expect(original).toEqual({ phone: "x", name: "y" });
  });

  it("si el campo no tenía error devuelve el mismo objeto (sin re-render)", () => {
    const original = { name: "y" };
    expect(clearFieldError(original, "phone")).toBe(original);
  });
});
