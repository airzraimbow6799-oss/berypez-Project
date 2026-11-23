import { describe, expect, it } from "vitest";

import { applyFlag, canFeature, keepSingleFeatured, normalizeFeatured } from "./featured";
import type { Promotion } from "./schema";

const NOW = Date.parse("2026-11-23T15:00:00Z");

const promo = (id: number, over: Partial<Promotion> = {}): Promotion => ({
  id,
  dishId: id,
  kind: "percent",
  percentOff: 20,
  priceCents: null,
  variantId: null,
  title: `Promo ${id}`,
  image: null,
  startsAt: null,
  endsAt: null,
  isActive: true,
  isFeatured: false,
  createdAt: "2026-11-01T00:00:00Z",
  ...over,
});

describe("promoción destacada", () => {
  it("solo se destaca una promoción activa hoy", () => {
    expect(canFeature(promo(1), NOW)).toBe(true);
    expect(canFeature(promo(2, { isActive: false }), NOW)).toBe(false);
    expect(canFeature(promo(3, { startsAt: "2026-12-01T00:00:00Z" }), NOW)).toBe(false);
    expect(canFeature(promo(4, { endsAt: "2026-11-20T00:00:00Z" }), NOW)).toBe(false);
  });

  it("al destacar una, la anterior deja de ser destacada", () => {
    const list = [promo(1, { isFeatured: true }), promo(2), promo(3)];
    const next = applyFlag(list, 2, "isFeatured", true, NOW);
    expect(next?.filter((p) => p.isFeatured).map((p) => p.id)).toEqual([2]);
  });

  it("no deja destacar una pausada ni una programada", () => {
    const list = [promo(1, { isActive: false }), promo(2, { startsAt: "2026-12-01T00:00:00Z" })];
    expect(applyFlag(list, 1, "isFeatured", true, NOW)).toBeNull();
    expect(applyFlag(list, 2, "isFeatured", true, NOW)).toBeNull();
  });

  it("quitar la estrella siempre se puede", () => {
    const list = [promo(1, { isFeatured: true })];
    expect(applyFlag(list, 1, "isFeatured", false, NOW)?.[0]?.isFeatured).toBe(false);
  });

  it("pausar una promoción le quita la estrella; activarla no se la pone", () => {
    const paused = applyFlag([promo(1, { isFeatured: true })], 1, "isActive", false, NOW);
    expect(paused?.[0]).toMatchObject({ isActive: false, isFeatured: false });
    const active = applyFlag([promo(1, { isActive: false })], 1, "isActive", true, NOW);
    expect(active?.[0]).toMatchObject({ isActive: true, isFeatured: false });
  });

  it("al guardar: una programada o pausada no queda destacada", () => {
    const { id: _id, createdAt: _c, ...data } = promo(1, { isFeatured: true });
    expect(normalizeFeatured(data, NOW).isFeatured).toBe(true);
    expect(normalizeFeatured({ ...data, isActive: false }, NOW).isFeatured).toBe(false);
    expect(normalizeFeatured({ ...data, startsAt: "2026-12-01T00:00:00Z" }, NOW).isFeatured).toBe(
      false,
    );
  });

  it("al guardar una destacada, las demás dejan de serlo", () => {
    const list = [promo(1, { isFeatured: true }), promo(2, { isFeatured: true })];
    expect(
      keepSingleFeatured(list, 2)
        .filter((p) => p.isFeatured)
        .map((p) => p.id),
    ).toEqual([2]);
    // Si la guardada no es destacada, no se toca nada.
    const plain = [promo(1, { isFeatured: true }), promo(2)];
    expect(keepSingleFeatured(plain, 2)).toBe(plain);
  });
});
