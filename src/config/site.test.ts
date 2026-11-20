import { describe, expect, it } from "vitest";

import { BRANCHES, FOUNDED_YEAR, yearsOpen } from "./site";

describe("yearsOpen", () => {
  it("cuenta los años desde la apertura en 2010", () => {
    expect(FOUNDED_YEAR).toBe(2010);
    expect(yearsOpen(new Date(2024, 5, 1))).toBe(14);
    expect(yearsOpen(new Date(2026, 10, 20))).toBe(16);
  });

  it("cambia solo al empezar el año siguiente", () => {
    expect(yearsOpen(new Date(2026, 11, 31))).toBe(16);
    expect(yearsOpen(new Date(2027, 0, 1))).toBe(17);
  });
});

describe("fotos de las sedes", () => {
  it("cada sede tiene foto en /sedes y texto alternativo que dice cuál es", () => {
    for (const branch of BRANCHES) {
      expect(branch.photo?.src).toBe(`/sedes/${branch.slug}.webp`);
      expect(branch.photo?.alt).toContain(branch.name);
    }
  });
});
