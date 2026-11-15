// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, json: async () => body }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("verifyTurnstile", () => {
  it("aprueba cuando Cloudflare responde success", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secreto");
    const fetchMock = mockFetch({ success: true });
    expect(await verifyTurnstile("token", "1.2.3.4")).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("secreto");
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("rechaza tokens inválidos o repetidos", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secreto");
    mockFetch({ success: false, "error-codes": ["timeout-or-duplicate"] });
    expect(await verifyTurnstile("token", null)).toBe(false);
  });

  it("rechaza si Cloudflare no responde o falta el secreto", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secreto");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("red"))),
    );
    expect(await verifyTurnstile("token", null)).toBe(false);

    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(await verifyTurnstile("token", null)).toBe(false);
  });
});
