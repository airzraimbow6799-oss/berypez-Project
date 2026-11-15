import { describe, expect, it, vi } from "vitest";

import { type ComplaintDeps, placeComplaint } from "./place-complaint";

const deps = (overrides: Partial<ComplaintDeps> = {}): ComplaintDeps => ({
  verifyTurnstile: vi.fn(async () => true),
  hitRateLimit: vi.fn(async () => true),
  getBranchId: vi.fn(async () => 2),
  insertComplaint: vi.fn(async () => ({ number: 15, createdAt: "2026-11-16T10:00:00Z" })),
  ...overrides,
});

const body = (extra: Record<string, unknown> = {}) => ({
  kind: "reclamo",
  branchSlug: "jesus-maria",
  name: "Rosa Quispe",
  documentType: "DNI",
  documentNumber: "45678912",
  phone: "987654321",
  email: "rosa@correo.pe",
  itemType: "producto",
  amountCents: 4500,
  description: "El ceviche llegó tibio y sin camote.",
  request: "Reposición del plato.",
  turnstileToken: "x",
  ...extra,
});

describe("placeComplaint", () => {
  it("registra el reclamo y devuelve el número correlativo", async () => {
    const d = deps();
    const result = await placeComplaint(body(), "1.1.1.1", d);
    expect(result).toEqual({
      status: 201,
      body: { success: true, data: { number: 15, createdAt: "2026-11-16T10:00:00Z" } },
    });
    expect(vi.mocked(d.insertComplaint).mock.calls[0]?.[0]).toMatchObject({
      kind: "reclamo",
      branch_id: 2,
      guardian_name: null,
    });
  });

  it("exige correo (ahí va la constancia) y el apoderado si es menor de edad", async () => {
    const result = await placeComplaint(body({ email: "", isMinor: true }), null, deps());
    const fields = (result.body as { error: { fields: Record<string, string> } }).error.fields;
    expect(Object.keys(fields)).toEqual(expect.arrayContaining(["email", "guardianName"]));
  });

  it("429, 403 y 500 sin filtrar detalles", async () => {
    expect(
      (await placeComplaint(body(), null, deps({ hitRateLimit: vi.fn(async () => false) }))).status,
    ).toBe(429);
    expect(
      (await placeComplaint(body(), null, deps({ verifyTurnstile: vi.fn(async () => false) })))
        .status,
    ).toBe(403);
    const failed = await placeComplaint(
      body(),
      null,
      deps({ insertComplaint: vi.fn(async () => Promise.reject(new Error("pg secreto"))) }),
    );
    expect(failed.status).toBe(500);
    expect(JSON.stringify(failed.body)).not.toContain("secreto");
  });
});
