import { describe, expect, it } from "vitest";

import { readConsent, shouldLoadAnalytics, writeConsent } from "./consent";

describe("consentimiento de cookies", () => {
  it("guarda y lee la elección", () => {
    window.localStorage.clear();
    expect(readConsent(window.localStorage)).toBeNull();
    writeConsent(window.localStorage, "rejected");
    expect(readConsent(window.localStorage)).toBe("rejected");
  });

  it("ignora valores desconocidos", () => {
    window.localStorage.setItem("berypez:cookies", "tal vez");
    expect(readConsent(window.localStorage)).toBeNull();
  });

  it("la analítica solo se carga con consentimiento y un ID válido", () => {
    expect(shouldLoadAnalytics("accepted", "G-ABC123")).toBe(true);
    expect(shouldLoadAnalytics(null, "G-ABC123")).toBe(false);
    expect(shouldLoadAnalytics("rejected", "G-ABC123")).toBe(false);
    expect(shouldLoadAnalytics("accepted", undefined)).toBe(false);
    expect(shouldLoadAnalytics("accepted", "<script>")).toBe(false);
  });
});
