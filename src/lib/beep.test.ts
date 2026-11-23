import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ALERT_NOTES, ALERT_SECONDS, beep } from "./beep";

/** Contexto de audio falso: cuenta cuántas notas se programan. */
function installFakeAudio(state: "running" | "suspended" = "running") {
  const started: number[] = [];
  const resume = vi.fn(async () => undefined);
  const ctx = {
    state,
    currentTime: 10,
    destination: {},
    resume,
    createGain: () => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (node: unknown) => node,
    }),
    createOscillator: () => ({
      type: "",
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start: (t: number) => started.push(t),
      stop: vi.fn(),
    }),
  };
  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return ctx;
      }
    },
  );
  return { started, resume };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("alerta sonora", () => {
  it("dura al menos 2 segundos y tiene varias notas (para que se note)", () => {
    expect(ALERT_SECONDS).toBeGreaterThanOrEqual(2);
    expect(ALERT_NOTES.length).toBeGreaterThanOrEqual(4);
  });

  it("programa todas las notas a partir de ahora y en orden", async () => {
    const { started } = installFakeAudio();
    const { beep: play } = await import("./beep");
    play();
    expect(started).toHaveLength(ALERT_NOTES.length);
    expect(started).toEqual([...started].sort((a, b) => a - b));
    expect(Math.min(...started)).toBeGreaterThan(10);
  });

  it("si el navegador dejó el audio dormido, intenta despertarlo", async () => {
    const { resume } = installFakeAudio("suspended");
    const { beep: play } = await import("./beep");
    play();
    expect(resume).toHaveBeenCalled();
  });

  it("sin audio disponible no lanza error", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => beep()).not.toThrow();
  });
});
