import { describe, expect, it } from "vitest";

import {
  activeSectionIndex,
  centeredScrollLeft,
  sectionScrollTarget,
  SPY_TOLERANCE_PX,
} from "./section-spy";

describe("activeSectionIndex", () => {
  const line = 160;

  it("marca la primera sección antes de llegar a ninguna", () => {
    expect(activeSectionIndex([400, 900, 1500], line)).toBe(0);
  });

  it("marca la última sección cuyo título ya pasó bajo la barra", () => {
    expect(activeSectionIndex([-800, -200, 150, 900], line)).toBe(2);
  });

  it("al llegar con un clic (título justo bajo la barra) marca esa, no la siguiente", () => {
    expect(activeSectionIndex([-1200, line, line + 700], line)).toBe(1);
    expect(activeSectionIndex([-1200, line + SPY_TOLERANCE_PX, line + 700], line)).toBe(1);
  });

  it("no marca la siguiente sección aunque esté cerca", () => {
    expect(activeSectionIndex([-500, line + SPY_TOLERANCE_PX + 1], line)).toBe(0);
  });

  it("sin secciones devuelve 0", () => {
    expect(activeSectionIndex([], line)).toBe(0);
  });
});

describe("centeredScrollLeft", () => {
  const bar = { width: 300, scrollWidth: 1000 };

  it("centra el chip", () => {
    expect(centeredScrollLeft({ offsetLeft: 500, width: 100 }, bar)).toBe(400);
  });

  it("no pasa del inicio ni del final", () => {
    expect(centeredScrollLeft({ offsetLeft: 20, width: 100 }, bar)).toBe(0);
    expect(centeredScrollLeft({ offsetLeft: 950, width: 50 }, bar)).toBe(700);
  });

  it("si todo cabe, no desplaza", () => {
    expect(
      centeredScrollLeft({ offsetLeft: 200, width: 80 }, { width: 600, scrollWidth: 600 }),
    ).toBe(0);
  });
});

describe("sectionScrollTarget", () => {
  it("deja el título justo bajo la barra fija", () => {
    expect(sectionScrollTarget(900, 1200, 160)).toBe(1940);
  });

  it("nunca devuelve una posición negativa", () => {
    expect(sectionScrollTarget(50, 0, 160)).toBe(0);
  });
});
