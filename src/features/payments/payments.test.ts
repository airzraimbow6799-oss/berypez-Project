import { describe, expect, it } from "vitest";

import {
  checkExpiry,
  cardLength,
  cvvLength,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  passesLuhn,
  TEST_CARDS,
  validateCard,
} from "./card";
import { simulatePayment, validateWallet } from "./simulate";

const NOW = new Date("2026-11-23T12:00:00-05:00");

describe("marca de la tarjeta", () => {
  it("se reconoce por los primeros dígitos", () => {
    expect(detectBrand("4111")).toBe("visa");
    expect(detectBrand("5555 5555")).toBe("mastercard");
    expect(detectBrand("2221 0000")).toBe("mastercard");
    expect(detectBrand("3782")).toBe("amex");
    expect(detectBrand("3600")).toBe("diners");
    expect(detectBrand("9999")).toBe("desconocida");
    expect(detectBrand("")).toBe("desconocida");
  });

  it("Amex tiene 15 dígitos y CVV de 4; las demás, 16 y 3", () => {
    expect(cardLength("amex")).toBe(15);
    expect(cvvLength("amex")).toBe(4);
    expect(cardLength("visa")).toBe(16);
    expect(cvvLength("visa")).toBe(3);
    expect(cardLength("diners")).toBe(14);
  });
});

describe("formato mientras se escribe", () => {
  it("agrupa de a cuatro y corta lo que sobra", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("41111111111111119999")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("4111")).toBe("4111");
    expect(formatCardNumber("41111")).toBe("4111 1");
  });

  it("Amex se agrupa 4-6-5", () => {
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
  });

  it("ignora letras y símbolos", () => {
    expect(formatCardNumber("4a1b1-1")).toBe("4111");
  });

  it("el vencimiento pone la barra solo", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("12/28/99")).toBe("12/28");
  });
});

describe("Luhn", () => {
  it("acepta los números de prueba conocidos y rechaza uno alterado", () => {
    expect(passesLuhn("4111 1111 1111 1111")).toBe(true);
    expect(passesLuhn("5555 5555 5555 4444")).toBe(true);
    expect(passesLuhn("3782 822463 10005")).toBe(true);
    expect(passesLuhn("4111 1111 1111 1112")).toBe(false);
    expect(passesLuhn("123")).toBe(false);
  });
});

describe("vencimiento", () => {
  it("acepta el mes en curso y los siguientes", () => {
    expect(checkExpiry("11/26", NOW).ok).toBe(true);
    expect(checkExpiry("08/29", NOW).ok).toBe(true);
  });
  it("rechaza vencidas, meses imposibles e incompletas", () => {
    expect(checkExpiry("10/26", NOW)).toEqual({ ok: false, message: "La tarjeta está vencida." });
    expect(checkExpiry("13/28", NOW).ok).toBe(false);
    expect(checkExpiry("00/28", NOW).ok).toBe(false);
    expect(checkExpiry("1", NOW).ok).toBe(false);
    expect(checkExpiry("12/99", NOW).ok).toBe(false);
  });
});

describe("validateCard", () => {
  const valid = { number: TEST_CARDS.aprobada, name: "Rocío Alarcón", expiry: "12/28", cvv: "123" };
  it("una tarjeta bien escrita no tiene errores", () => {
    expect(validateCard(valid, NOW)).toEqual({});
  });
  it("marca cada campo malo con un mensaje claro", () => {
    const errors = validateCard(
      { number: "4111 1111", name: "A", expiry: "01/20", cvv: "12" },
      NOW,
    );
    expect(Object.keys(errors).sort()).toEqual(["cvv", "expiry", "name", "number"]);
  });
  it("Amex pide CVV de 4 dígitos", () => {
    const amex = { ...valid, number: "3782 822463 10005", cvv: "123" };
    expect(validateCard(amex, NOW).cvv).toContain("4 dígitos");
    expect(validateCard({ ...amex, cvv: "1234" }, NOW)).toEqual({});
  });
  it("la tarjeta de prueba rechazada es un número válido (el rechazo lo da el banco)", () => {
    expect(validateCard({ ...valid, number: TEST_CARDS.rechazada }, NOW)).toEqual({});
  });
});

describe("pago simulado", () => {
  const base = {
    method: "card" as const,
    phone: "",
    yapeCode: "",
    cardNumber: TEST_CARDS.aprobada,
  };

  it("aprueba una tarjeta normal con una referencia de simulación", async () => {
    const out = await simulatePayment(base, { delayMs: 0 });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.reference).toMatch(/^SIM-\d{6}$/);
  });

  it("el banco rechaza la tarjeta de prueba que termina en 0002", async () => {
    const out = await simulatePayment(
      { ...base, cardNumber: TEST_CARDS.rechazada },
      { delayMs: 0 },
    );
    expect(out).toMatchObject({ ok: false });
  });

  it("Yape rechaza el código 000000 y acepta otro", async () => {
    const yape = {
      method: "yape" as const,
      phone: "912345678",
      yapeCode: "000000",
      cardNumber: "",
    };
    expect((await simulatePayment(yape, { delayMs: 0 })).ok).toBe(false);
    expect((await simulatePayment({ ...yape, yapeCode: "482913" }, { delayMs: 0 })).ok).toBe(true);
  });

  it("Plin se aprueba", async () => {
    const plin = { method: "plin" as const, phone: "912345678", yapeCode: "", cardNumber: "" };
    expect((await simulatePayment(plin, { delayMs: 0 })).ok).toBe(true);
  });
});

describe("validateWallet", () => {
  it("Yape pide celular y código de 6 dígitos; Plin solo el celular", () => {
    expect(validateWallet("yape", "912345678", "123456")).toEqual({});
    expect(Object.keys(validateWallet("yape", "12345", "12"))).toEqual(["phone", "yapeCode"]);
    expect(validateWallet("plin", "912345678", "")).toEqual({});
    expect(validateWallet("plin", "812345678", "").phone).toBeDefined();
  });
});
