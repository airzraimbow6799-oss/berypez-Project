import { describe, expect, it, vi } from "vitest";

import { MODE_OPTIONS, modeLabel, parseMode, readStoredMode, writeStoredMode } from "./mode";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

describe("MODE_OPTIONS", () => {
  it("ofrece delivery y recojo en cada sede", () => {
    expect(MODE_OPTIONS.map((o) => o.id)).toEqual([
      "delivery",
      "pickup:lince",
      "pickup:jesus-maria",
    ]);
  });
});

describe("parseMode", () => {
  it("acepta un delivery válido", () => {
    expect(parseMode('{"modality":"delivery"}')).toEqual({ modality: "delivery" });
  });

  it("acepta un recojo con sede válida", () => {
    expect(parseMode('{"modality":"pickup","branch":"lince"}')).toEqual({
      modality: "pickup",
      branch: "lince",
    });
  });

  it.each([
    null,
    "",
    "no-json",
    '{"modality":"pickup"}',
    '{"modality":"pickup","branch":"miraflores"}',
    "[]",
  ])("devuelve null si el valor guardado es inválido: %s", (raw) => {
    expect(parseMode(raw)).toBeNull();
  });
});

describe("modeLabel", () => {
  it("nombra la modalidad y la sede", () => {
    expect(modeLabel({ modality: "delivery" })).toBe("Delivery");
    expect(modeLabel({ modality: "pickup", branch: "jesus-maria" })).toBe("Recojo en Jesús María");
  });
});

describe("almacenamiento de la sesión", () => {
  it("guarda y vuelve a leer la modalidad", () => {
    const storage = memoryStorage();
    writeStoredMode(storage, { modality: "pickup", branch: "lince" });
    expect(readStoredMode(storage)).toEqual({ modality: "pickup", branch: "lince" });
  });

  it("no falla si el almacenamiento está bloqueado", () => {
    const blocked = memoryStorage();
    blocked.getItem = vi.fn(() => {
      throw new Error("SecurityError");
    });
    blocked.setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    expect(readStoredMode(blocked)).toBeNull();
    expect(() => writeStoredMode(blocked, { modality: "delivery" })).not.toThrow();
  });

  it("no falla si no hay almacenamiento (render en el servidor)", () => {
    expect(readStoredMode(undefined)).toBeNull();
    expect(() => writeStoredMode(undefined, { modality: "delivery" })).not.toThrow();
  });
});
