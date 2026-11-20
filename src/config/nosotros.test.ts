import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { formatMonthYear, MILESTONES, PRESS_QUOTES, PRESS_VIDEOS, RECOGNITIONS } from "./nosotros";

describe("contenido de Nosotros", () => {
  it("los hitos van en orden y empiezan en la apertura de 2010", () => {
    const years = MILESTONES.map((m) => m.year);
    expect(years[0]).toBe(2010);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it("todo dato enlaza a una fuente pública por https", () => {
    const links = [
      ...MILESTONES.flatMap((m) => (m.source ? [m.source.href] : [])),
      ...PRESS_QUOTES.map((q) => q.href),
      ...RECOGNITIONS.flatMap((r) => (r.href ? [r.href] : [])),
    ];
    expect(links.length).toBeGreaterThan(10);
    for (const href of links) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("cada video tiene su miniatura guardada en la web (no se pide a YouTube)", () => {
    for (const video of PRESS_VIDEOS) {
      expect(video.id).toMatch(/^[\w-]{11}$/);
      expect(existsSync(join(process.cwd(), "public/nosotros/videos", `${video.id}.webp`))).toBe(
        true,
      );
    }
  });
});

describe("formatMonthYear", () => {
  it("escribe el mes en español con mayúscula", () => {
    expect(formatMonthYear("2023-05")).toBe("Mayo 2023");
    expect(formatMonthYear("2019-12")).toBe("Diciembre 2019");
  });

  it("devuelve el texto tal cual si no es año-mes", () => {
    expect(formatMonthYear("2019")).toBe("2019");
  });
});
