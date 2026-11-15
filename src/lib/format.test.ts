import { describe, expect, it } from "vitest";

import { formatPrice, formatPriceFrom } from "./format";

describe("formatPrice", () => {
  it("muestra soles con dos decimales a partir de céntimos", () => {
    expect(formatPrice(4800)).toBe("S/ 48.00");
    expect(formatPrice(750)).toBe("S/ 7.50");
    expect(formatPrice(0)).toBe("S/ 0.00");
    expect(formatPrice(15500)).toBe("S/ 155.00");
  });

  it("separa miles con coma", () => {
    expect(formatPrice(123456)).toBe("S/ 1,234.56");
  });
});

describe("formatPriceFrom", () => {
  it("antepone “desde” cuando hay variantes con precios distintos", () => {
    expect(formatPriceFrom(4200, [4200, 5800])).toBe("Desde S/ 42.00");
  });

  it("muestra el precio solo si no hay variantes o todas cuestan igual", () => {
    expect(formatPriceFrom(2500, [])).toBe("S/ 25.00");
    expect(formatPriceFrom(2500, [2500, 2500])).toBe("S/ 25.00");
  });
});
