import { describe, expect, it } from "vitest";

import { shouldShowPromoPopup } from "./PromoPopup";

const base = { documentUrl: "https://berypez.pe/", pathname: "/", cookies: "" };

describe("shouldShowPromoPopup", () => {
  it("sale al cargar o recargar estando en Inicio", () => {
    expect(shouldShowPromoPopup(base)).toBe(true);
    expect(shouldShowPromoPopup({ ...base, documentUrl: "https://berypez.pe/?utm=fb" })).toBe(true);
  });
  it("no sale si la página se cargó en otra sección (aunque ahora esté en Inicio)", () => {
    expect(shouldShowPromoPopup({ ...base, documentUrl: "https://berypez.pe/carta/marina" })).toBe(
      false,
    );
  });
  it("no sale fuera de Inicio ni con la cookie que la apaga", () => {
    expect(shouldShowPromoPopup({ ...base, pathname: "/reservas" })).toBe(false);
    expect(shouldShowPromoPopup({ ...base, cookies: "a=1; berypez_sin_promo=1" })).toBe(false);
    expect(shouldShowPromoPopup({ ...base, documentUrl: undefined })).toBe(false);
  });
});
