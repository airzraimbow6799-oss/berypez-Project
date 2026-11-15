import { describe, expect, it } from "vitest";

import { checkoutSchema, fieldErrors, normalizePhone } from "./schema";

const valid = {
  name: "Rosa Quispe",
  phone: "987 654 321",
  email: "",
  modality: "pickup",
  branchSlug: "jesus-maria",
  district: "",
  address: "",
  addressReference: "",
  scheduledFor: "",
  paymentMethod: "cash",
  cashChangeForCents: null,
  notes: "",
  acceptTerms: true,
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  items: [{ productId: 1, variantId: null, quantity: 2, choices: {}, note: "" }],
};

describe("normalizePhone", () => {
  it("quita espacios, guiones y el prefijo +51", () => {
    expect(normalizePhone("+51 987-654-321")).toBe("987654321");
  });
});

describe("checkoutSchema", () => {
  it("acepta un recojo sin dirección y normaliza el celular", () => {
    const result = checkoutSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.phone).toBe("987654321");
  });

  it("delivery exige distrito y dirección", () => {
    const result = checkoutSchema.safeParse({ ...valid, modality: "delivery" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toMatchObject({
      district: "Elige tu distrito.",
      address: "Escribe la dirección de entrega.",
    });
  });

  it("rechaza un celular que no es peruano", () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: "12345" });
    expect(fieldErrors(result.error!).phone).toBe(
      "Ingresa un celular de 9 dígitos que empiece con 9.",
    );
  });

  it("exige aceptar los términos y el antibots", () => {
    const result = checkoutSchema.safeParse({ ...valid, acceptTerms: false, turnstileToken: "" });
    expect(fieldErrors(result.error!)).toMatchObject({
      acceptTerms: "Acepta los términos para continuar.",
      turnstileToken: "Confirma que no eres un robot.",
    });
  });

  it("no acepta un carrito vacío ni cantidades fuera de rango", () => {
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, items: [{ ...valid.items[0], quantity: 99 }] }).success,
    ).toBe(false);
  });

  it("valida el correo solo si se escribe", () => {
    expect(checkoutSchema.safeParse({ ...valid, email: "no-es-correo" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, email: "rosa@correo.pe" }).success).toBe(true);
  });
});
