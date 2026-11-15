import { describe, expect, it } from "vitest";

import { whatsappOrderMessage } from "./whatsapp";

describe("whatsappOrderMessage", () => {
  it("envía el carrito completo con variantes, elecciones, notas y total", () => {
    const message = whatsappOrderMessage(
      [
        {
          name: "Parihuelas",
          variantLabel: "Cabrilla",
          choices: {},
          note: "",
          quantity: 1,
          unitPriceCents: 5800,
        },
        {
          name: "Milanesa de pollo",
          variantLabel: null,
          choices: { "Guarnición 01": "Arroz" },
          note: "sin culantro",
          quantity: 2,
          unitPriceCents: 3500,
        },
      ],
      "Recojo en Jesús María",
    );
    expect(message).toBe(
      [
        "Hola Berypez, quiero hacer este pedido (Recojo en Jesús María):",
        "",
        "• 1 × Parihuelas (Cabrilla) — S/ 58.00",
        "• 2 × Milanesa de pollo — S/ 70.00",
        "   Arroz",
        "   Nota: sin culantro",
        "",
        "Subtotal: S/ 128.00",
      ].join("\n"),
    );
  });
});
